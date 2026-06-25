import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { subYears, max, parseISO } from 'date-fns';
import { ActivarReporteDto } from '../webhook/dto/activar-reporte.dto';
import { ReporteActivo } from '../database/entities/reporte-activo.entity';
import { ReporteActivoRepository } from '../database/repositories/reporte-activo.repository';
import { CoincidenciaRepository } from '../database/repositories/coincidencia.repository';
import { PuiClientService } from '../pui-client/pui-client.service';
import { AuditLoggerService } from '../logger/audit-logger.service';
import { CoincidenciaMapper } from './coincidencia.mapper';
import {
  SistemaInternoRepository,
  SISTEMA_INTERNO_REPOSITORY,
  DatosBasicosPersona,
} from '../sistema-interno/sistema-interno.repository.interface';
import { BusquedaContinuaService } from './busqueda-continua.service';

@Injectable()
export class BusquedaService {
  private readonly logger = new Logger(BusquedaService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(SISTEMA_INTERNO_REPOSITORY)
    private readonly sistemaInterno: SistemaInternoRepository,
    private readonly puiClient: PuiClientService,
    private readonly reporteRepo: ReporteActivoRepository,
    private readonly coincidenciaRepo: CoincidenciaRepository,
    private readonly auditLogger: AuditLoggerService,
    private readonly mapper: CoincidenciaMapper,
    private readonly busquedaContinua: BusquedaContinuaService,
  ) {}

  async procesarReporteAsync(dto: ActivarReporteDto): Promise<void> {
    const reporte = await this.reporteRepo.save({
      id: dto.id,
      curp: dto.curp,
      nombre: dto.nombre,
      primerApellido: dto.primer_apellido,
      segundoApellido: dto.segundo_apellido,
      fechaNacimiento: dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : undefined,
      fechaDesaparicion: dto.fecha_desaparicion ? new Date(dto.fecha_desaparicion) : undefined,
      lugarNacimiento: dto.lugar_nacimiento,
      sexoAsignado: dto.sexo_asignado,
      telefono: dto.telefono,
      correo: dto.correo,
      direccion: dto.direccion,
      calle: dto.calle,
      numero: dto.numero,
      colonia: dto.colonia,
      codigoPostal: dto.codigo_postal,
      municipioOAlcaldia: dto.municipio_o_alcaldia,
      entidadFederativa: dto.entidad_federativa,
      activo: true,
    });

    await this.ejecutarFase1(dto, reporte);
    await this.ejecutarFase2(dto, reporte);

    await this.puiClient.busquedaFinalizada({
      id: dto.id,
      institucion_id: this.config.get<string>('RFC_INSTITUCION')!,
    });

    await this.auditLogger.log({
      tipo: 'ENVIADO_FINALIZADA',
      reporteId: dto.id,
      curp: dto.curp,
      endpoint: '/busqueda-finalizada',
    });

    await this.reporteRepo.marcarFase2(dto.id);
    await this.busquedaContinua.registrar(reporte);
  }

  private tieneAlgunCampo(datos: DatosBasicosPersona): boolean {
    return !!(
      datos.nombre || datos.primer_apellido || datos.segundo_apellido ||
      datos.fecha_nacimiento || datos.telefono || datos.correo || datos.domicilio
    );
  }

  private async ejecutarFase1(dto: ActivarReporteDto, _reporte: ReporteActivo): Promise<void> {
    try {
      const datos = await this.sistemaInterno.buscarDatosBasicos(dto.curp);
      if (!datos || !this.tieneAlgunCampo(datos)) {
        this.logger.log(`Fase 1 - Sin datos para ${dto.id}`);
        return;
      }

      const payload = await this.mapper.toDto(datos, dto, false);
      payload.fase_busqueda = '1';

      const httpStatus = await this.puiClient.notificarCoincidencia(
        payload as import('../pui-client/dto/notificar-coincidencia.dto').NotificarCoincidenciaDto,
      );

      await this.coincidenciaRepo.save({
        reporteId: dto.id,
        faseBusqueda: '1',
        httpStatus,
        payloadResumen: { curp_hash: dto.curp.slice(-4) },
      });

      await this.auditLogger.log({
        tipo: 'ENVIADO_COINCIDENCIA',
        reporteId: dto.id,
        curp: dto.curp,
        faseBusqueda: '1',
        httpStatus,
      });

      await this.reporteRepo.marcarFase1(dto.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.auditLogger.log({ tipo: 'ERROR_PUI', reporteId: dto.id, curp: dto.curp, faseBusqueda: '1', errorMensaje: msg });
    }
  }

  private async ejecutarFase2(dto: ActivarReporteDto, _reporte: ReporteActivo): Promise<void> {
    if (!dto.fecha_desaparicion) {
      this.logger.log(`Fase 2 omitida (sin fecha_desaparicion) para ${dto.id}`);
      return;
    }

    try {
      const fechaDesap = parseISO(dto.fecha_desaparicion);
      const hace12 = subYears(new Date(), 12);
      const desde = max([fechaDesap, hace12]);

      const eventos = await this.sistemaInterno.buscarEventosHistoricos(dto.curp, desde, new Date());

      for (const evento of eventos) {
        const payload = await this.mapper.toDto(evento, dto, true);
        payload.fase_busqueda = '2';

        const httpStatus = await this.puiClient.notificarCoincidencia(
          payload as import('../pui-client/dto/notificar-coincidencia.dto').NotificarCoincidenciaDto,
        );

        await this.coincidenciaRepo.save({
          reporteId: dto.id,
          faseBusqueda: '2',
          tipoEvento: evento.tipo_evento,
          fechaEvento: new Date(evento.fecha_evento),
          httpStatus,
        });

        await this.auditLogger.log({
          tipo: 'ENVIADO_COINCIDENCIA',
          reporteId: dto.id,
          curp: dto.curp,
          faseBusqueda: '2',
          httpStatus,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.auditLogger.log({ tipo: 'ERROR_PUI', reporteId: dto.id, curp: dto.curp, faseBusqueda: '2', errorMensaje: msg });
    }
  }
}
