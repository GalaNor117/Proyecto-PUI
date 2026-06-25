import { Module } from '@nestjs/common';
import { BusquedaService } from './busqueda.service';
import { BusquedaContinuaService } from './busqueda-continua.service';
import { CoincidenciaMapper } from './coincidencia.mapper';
import { PuiClientModule } from '../pui-client/pui-client.module';
import { SistemaInternoModule } from '../sistema-interno/sistema-interno.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';
import { BiometricoModule } from '../biometrico/biometrico.module';

@Module({
  imports: [PuiClientModule, SistemaInternoModule, DatabaseModule, LoggerModule, BiometricoModule],
  providers: [BusquedaService, BusquedaContinuaService, CoincidenciaMapper],
  exports: [BusquedaService, BusquedaContinuaService],
})
export class BusquedaModule {}
