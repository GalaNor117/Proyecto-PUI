import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ReporteActivo } from '../database/entities/reporte-activo.entity';
import { ReporteActivoRepository } from '../database/repositories/reporte-activo.repository';
import { CoincidenciaRepository } from '../database/repositories/coincidencia.repository';
import { PuiClientService } from '../pui-client/pui-client.service';
import { AuditLoggerService } from '../logger/audit-logger.service';
import {
  SistemaInternoRepository,
  SISTEMA_INTERNO_REPOSITORY,
} from '../sistema-interno/sistema-interno.repository.interface';
import { CoincidenciaMapper } from './coincidencia.mapper';

@Injectable()
export class BusquedaContinuaService {
  private readonly logger = new Logger(BusquedaContinuaService.name);
  private readonly reportesActivos = new Set<string>();

  constructor(
    private readonly config: ConfigService,
    @Inject(SISTEMA_INTERNO_REPOSITORY)
    private readonly sistemaInterno: SistemaInternoRepository,
    private readonly puiClient: PuiClientService,
    private readonly reporteRepo: ReporteActivoRepository,
    private readonly coincidenciaRepo: CoincidenciaRepository,
    private readonly auditLogger: AuditLoggerService,
    private readonly mapper: CoincidenciaMapper,
  ) {}

  async registrar(reporte: ReporteActivo): Promise<void> {
    this.reportesActivos.add(reporte.id);
  }

  async detener(reporteId: string): Promise<void> {
    this.reportesActivos.delete(reporteId);
  }

  @Cron(process.env['BUSQUEDA_CONTINUA_CRON'] ?? '0 * * * *')
  async ejecutarFase3(): Promise<void> {
    this.logger.log('Scheduler Fase 3 iniciado');
    await this.auditLogger.log({ tipo: 'SCHEDULER_INICIO', metadata: { fase: 3 } });

    const activos = await this.reporteRepo.findActivos();

    for (const reporte of activos) {
      if (!this.reportesActivos.has(reporte.id)) continue;

      try {
        const desde = reporte.ultimaRevisionFase3 ?? reporte.fechaActivacion;
        const eventos = await this.sistemaInterno.buscarEventosNuevos(reporte.curp, desde);

        for (const evento of eventos) {
          const payload = await this.mapper.toDto(evento, reporte, true);
          payload.fase_busqueda = '3';

          const httpStatus = await this.puiClient.notificarCoincidencia(
            payload as import('../pui-client/dto/notificar-coincidencia.dto').NotificarCoincidenciaDto,
          );

          await this.coincidenciaRepo.save({
            reporteId: reporte.id,
            faseBusqueda: '3',
            tipoEvento: evento.tipo_evento,
            fechaEvento: new Date(evento.fecha_evento),
            httpStatus,
          });

          await this.auditLogger.log({
            tipo: 'ENVIADO_COINCIDENCIA',
            reporteId: reporte.id,
            curp: reporte.curp,
            faseBusqueda: '3',
            httpStatus,
          });
        }

        await this.reporteRepo.actualizarRevision(reporte.id, new Date());
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await this.auditLogger.log({
          tipo: 'ERROR_PUI',
          reporteId: reporte.id,
          curp: reporte.curp,
          faseBusqueda: '3',
          errorMensaje: msg,
        });
      }
    }

    await this.auditLogger.log({ tipo: 'SCHEDULER_FIN', metadata: { fase: 3 } });
    this.logger.log('Scheduler Fase 3 completado');
  }
}
