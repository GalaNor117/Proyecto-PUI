import {
  Controller, Post, Body, HttpCode, UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { BusquedaService } from '../busqueda/busqueda.service';
import { BusquedaContinuaService } from '../busqueda/busqueda-continua.service';
import { ReporteActivoRepository } from '../database/repositories/reporte-activo.repository';
import { AuditLoggerService } from '../logger/audit-logger.service';
import { ActivarReporteDto } from './dto/activar-reporte.dto';
import { DesactivarReporteDto } from './dto/desactivar-reporte.dto';

class LoginWebhookDto {
  @IsString() @MinLength(3) @MaxLength(3) usuario: string;
  @IsString() @MinLength(16) @MaxLength(20) clave: string;
}

@Controller()
export class WebhookController {
  constructor(
    private readonly authService: AuthService,
    private readonly busquedaService: BusquedaService,
    private readonly busquedaContinua: BusquedaContinuaService,
    private readonly reporteRepo: ReporteActivoRepository,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  login(@Body() dto: LoginWebhookDto) {
    return this.authService.login(dto.usuario, dto.clave);
  }

  @Post('activar-reporte')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async activarReporte(@Body() dto: ActivarReporteDto) {
    await this.auditLogger.log({
      tipo: 'RECIBIDO_ACTIVAR',
      reporteId: dto.id,
      curp: dto.curp,
      endpoint: '/activar-reporte',
    });

    setImmediate(() => {
      this.busquedaService.procesarReporteAsync(dto).catch((err: Error) => {
        this.auditLogger.log({
          tipo: 'ERROR_WEBHOOK',
          reporteId: dto.id,
          curp: dto.curp,
          errorMensaje: err.message,
        });
      });
    });

    return { message: 'La solicitud de activación del reporte de búsqueda se recibió correctamente.' };
  }

  @Post('activar-reporte-prueba')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async activarReportePrueba(@Body() _dto: ActivarReporteDto) {
    return { message: 'Prueba recibida correctamente.' };
  }

  @Post('desactivar-reporte')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async desactivarReporte(@Body() dto: DesactivarReporteDto) {
    const reporte = await this.reporteRepo.findById(dto.id);
    if (!reporte) throw new NotFoundException(`Reporte ${dto.id} no encontrado`);

    await this.reporteRepo.desactivar(dto.id);
    await this.busquedaContinua.detener(dto.id);

    await this.auditLogger.log({
      tipo: 'RECIBIDO_DESACTIVAR',
      reporteId: dto.id,
      endpoint: '/desactivar-reporte',
    });

    return { message: 'Registro de finalización de búsqueda histórica guardado correctamente' };
  }
}
