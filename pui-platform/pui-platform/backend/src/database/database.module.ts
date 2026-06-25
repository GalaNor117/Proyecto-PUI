import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ReporteActivo } from './entities/reporte-activo.entity';
import { Coincidencia } from './entities/coincidencia.entity';
import { LogInteraccion } from './entities/log-interaccion.entity';
import { UsuarioPanel } from './entities/usuario-panel.entity';
import { ReporteActivoRepository } from './repositories/reporte-activo.repository';
import { CoincidenciaRepository } from './repositories/coincidencia.repository';
import { LogInteraccionRepository } from './repositories/log-interaccion.repository';
import { UsuarioPanelRepository } from './repositories/usuario-panel.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [ReporteActivo, Coincidencia, LogInteraccion, UsuarioPanel],
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: config.get('NODE_ENV') === 'production',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([ReporteActivo, Coincidencia, LogInteraccion, UsuarioPanel]),
  ],
  providers: [
    ReporteActivoRepository,
    CoincidenciaRepository,
    LogInteraccionRepository,
    UsuarioPanelRepository,
  ],
  exports: [
    TypeOrmModule,
    ReporteActivoRepository,
    CoincidenciaRepository,
    LogInteraccionRepository,
    UsuarioPanelRepository,
  ],
})
export class DatabaseModule {}
