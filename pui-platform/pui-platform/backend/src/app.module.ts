import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PanelAuthModule } from './panel-auth/panel-auth.module';
import { PuiClientModule } from './pui-client/pui-client.module';
import { WebhookModule } from './webhook/webhook.module';
import { BusquedaModule } from './busqueda/busqueda.module';
import { PanelModule } from './panel/panel.module';
import { LoggerModule } from './logger/logger.module';
import { HealthModule } from './health/health.module';
import { CurpModule } from './curp/curp.module';
import { SistemaInternoModule } from './sistema-interno/sistema-interno.module';
import { BiometricoModule } from './biometrico/biometrico.module';
import { PuiClientService } from './pui-client/pui-client.service';
import { ReporteActivoRepository } from './database/repositories/reporte-activo.repository';
import { BusquedaService } from './busqueda/busqueda.service';
import { BusquedaContinuaService } from './busqueda/busqueda-continua.service';
import { AuditLoggerService } from './logger/audit-logger.service';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    PanelAuthModule,
    PuiClientModule,
    WebhookModule,
    BusquedaModule,
    PanelModule,
    LoggerModule,
    HealthModule,
    CurpModule,
    SistemaInternoModule,
    BiometricoModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly puiClient: PuiClientService,
    private readonly reporteRepo: ReporteActivoRepository,
    private readonly busquedaService: BusquedaService,
    private readonly busquedaContinua: BusquedaContinuaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.resincronizar();
  }

  private async resincronizar(): Promise<void> {
    this.logger.log('Iniciando resincronización con PUI...');
    try {
      const reportesPui = await this.puiClient.getReportes();
      const reportesLocales = await this.reporteRepo.findActivos();
      const idsLocales = new Set(reportesLocales.map(r => r.id));

      for (const reporte of reportesPui) {
        if (!idsLocales.has(reporte.id)) {
          this.logger.log(`Procesando reporte faltante: ${reporte.id}`);
          await this.busquedaService.procesarReporteAsync(reporte as unknown as import('./webhook/dto/activar-reporte.dto').ActivarReporteDto);
        } else {
          const local = reportesLocales.find(r => r.id === reporte.id);
          if (local) await this.busquedaContinua.registrar(local);
        }
      }

      await this.auditLogger.log({
        tipo: 'RESINCRONIZACION',
        metadata: { total_pui: reportesPui.length, procesados: reportesPui.length - idsLocales.size },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error en resincronización: ${msg}`);
    }
  }
}
