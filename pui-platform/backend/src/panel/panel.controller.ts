import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, BadRequestException } from '@nestjs/common';
import { PanelJwtAuthGuard } from '../panel-auth/panel-jwt-auth.guard';
import { ReporteActivoRepository } from '../database/repositories/reporte-activo.repository';
import { CoincidenciaRepository } from '../database/repositories/coincidencia.repository';
import { LogInteraccionRepository } from '../database/repositories/log-interaccion.repository';
import { BusquedaContinuaService } from '../busqueda/busqueda-continua.service';
import { AuditLoggerService } from '../logger/audit-logger.service';

const CURP_REGEX = /^[A-Z0-9]{18}$/;

@Controller('panel')
@UseGuards(PanelJwtAuthGuard)
export class PanelController {
  constructor(
    private readonly reporteRepo: ReporteActivoRepository,
    private readonly coincidenciaRepo: CoincidenciaRepository,
    private readonly logRepo: LogInteraccionRepository,
    private readonly busquedaContinua: BusquedaContinuaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [activos, total, estaSemana, totalCoinc, porFase, esteMes] = await Promise.all([
      this.reporteRepo.countActivos(),
      this.reporteRepo.countTotal(),
      this.reporteRepo.countEstaSemana(),
      this.coincidenciaRepo.countTotal(),
      this.coincidenciaRepo.countPorFase(),
      this.coincidenciaRepo.countEsteMes(),
    ]);

    return {
      reportes: { activos, total, esta_semana: estaSemana },
      coincidencias: { total: totalCoinc, por_fase: porFase, este_mes: esteMes },
      sistema: {
        ultima_sincronizacion: new Date().toISOString(),
        estado_conexion_pui: 'ok',
        scheduler_activo: true,
      },
    };
  }

  @Get('reportes')
  async reportes(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
    @Query('activo') activo?: string,
    @Query('busqueda') busqueda?: string,
  ) {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    const { datos, total } = await this.reporteRepo.findAll({ pagina, limite, activo: activoBool, busqueda });
    return { datos, total, pagina, total_paginas: Math.ceil(total / limite) };
  }

  @Get('reportes/:id')
  async reporteDetalle(@Param('id') id: string) {
    return this.reporteRepo.findById(id);
  }

  @Get('reportes/:id/timeline')
  async reporteTimeline(@Param('id') id: string) {
    const [reporte, coincidencias] = await Promise.all([
      this.reporteRepo.findById(id),
      this.coincidenciaRepo.findByReporteId(id),
    ]);
    return { reporte, coincidencias };
  }

  @Get('coincidencias')
  async coincidencias(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
    @Query('reporte_id') reporteId?: string,
    @Query('fase') fase?: string,
    @Query('desde') desde?: string,
  ) {
    const { datos, total } = await this.coincidenciaRepo.findAll({ pagina, limite, reporteId, fase, desde });
    return { datos, total, pagina, total_paginas: Math.ceil(total / limite) };
  }

  @Get('verificar-curp/:curp')
  async verificarCurp(@Param('curp') curp: string) {
    const normalizada = (curp ?? '').trim().toUpperCase();
    if (!CURP_REGEX.test(normalizada)) {
      throw new BadRequestException('CURP inválida: debe ser 18 caracteres alfanuméricos en mayúsculas');
    }

    const reporte = await this.reporteRepo.findActivoByCurp(normalizada);
    const extraviada = reporte !== null;

    await this.auditLogger.log({
      tipo: 'VERIFICACION_CURP',
      curp: normalizada,
      reporteId: reporte?.id,
      metadata: { extraviada },
    });

    return {
      curp: normalizada,
      extraviada,
      reporte: reporte ?? undefined,
      verificado_en: new Date().toISOString(),
    };
  }

  @Get('logs')
  async logs(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(50), ParseIntPipe) limite: number,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const { datos, total } = await this.logRepo.findAll({ pagina, limite, tipo, desde, hasta });
    return { datos, total, pagina, total_paginas: Math.ceil(total / limite) };
  }
}
