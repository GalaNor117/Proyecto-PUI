import { Module } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class LoggerModule {}
