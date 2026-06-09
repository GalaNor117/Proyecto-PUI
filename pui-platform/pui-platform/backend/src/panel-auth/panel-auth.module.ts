import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PanelAuthService } from './panel-auth.service';
import { PanelAuthController } from './panel-auth.controller';
import { PanelJwtStrategy } from './panel-jwt.strategy';
import { PanelJwtAuthGuard } from './panel-jwt-auth.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    PassportModule,
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('PANEL_JWT_SECRET'),
        signOptions: { expiresIn: config.get<number>('PANEL_JWT_EXPIRATION_SECONDS') },
      }),
    }),
  ],
  controllers: [PanelAuthController],
  providers: [PanelAuthService, PanelJwtStrategy, PanelJwtAuthGuard],
  exports: [PanelJwtAuthGuard, PanelAuthService],
})
export class PanelAuthModule {}
