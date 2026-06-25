import { Module } from '@nestjs/common';
import { CurpService } from './curp.service';

@Module({ providers: [CurpService], exports: [CurpService] })
export class CurpModule {}
