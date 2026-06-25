import { Module } from '@nestjs/common';
import { BiometricoService } from './biometrico.service';

@Module({ providers: [BiometricoService], exports: [BiometricoService] })
export class BiometricoModule {}
