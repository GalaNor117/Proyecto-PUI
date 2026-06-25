import { Module } from '@nestjs/common';
import { PanelController } from './panel.controller';
import { PanelAuthModule } from '../panel-auth/panel-auth.module';
import { DatabaseModule } from '../database/database.module';
import { PuiClientModule } from '../pui-client/pui-client.module';
import { BusquedaModule } from '../busqueda/busqueda.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [PanelAuthModule, DatabaseModule, PuiClientModule, BusquedaModule, LoggerModule],
  controllers: [PanelController],
})
export class PanelModule {}
