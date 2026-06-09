import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { AuthModule } from '../auth/auth.module';
import { BusquedaModule } from '../busqueda/busqueda.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AuthModule, BusquedaModule, DatabaseModule, LoggerModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
