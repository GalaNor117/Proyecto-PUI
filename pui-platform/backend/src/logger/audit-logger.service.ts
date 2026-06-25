import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { LogInteraccionRepository } from '../database/repositories/log-interaccion.repository';

export type TipoLog =
  | 'RECIBIDO_ACTIVAR'
  | 'RECIBIDO_DESACTIVAR'
  | 'ENVIADO_COINCIDENCIA'
  | 'ENVIADO_FINALIZADA'
  | 'ERROR_PUI'
  | 'ERROR_WEBHOOK'
  | 'SCHEDULER_INICIO'
  | 'SCHEDULER_FIN'
  | 'RESINCRONIZACION'
  | 'VERIFICACION_CURP';

export interface AuditLogData {
  tipo: TipoLog;
  reporteId?: string;
  curp?: string;
  endpoint?: string;
  faseBusqueda?: string;
  httpStatus?: number;
  errorMensaje?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLoggerService {
  constructor(private readonly logRepo: LogInteraccionRepository) {}

  async log(data: AuditLogData): Promise<void> {
    await this.logRepo.save({
      tipo: data.tipo,
      reporteId: data.reporteId,
      curpHash: data.curp ? this.hashCurp(data.curp) : undefined,
      endpoint: data.endpoint,
      faseBusqueda: data.faseBusqueda,
      httpStatus: data.httpStatus,
      errorMensaje: data.errorMensaje,
      metadata: data.metadata,
    });
  }

  private hashCurp(curp: string): string {
    return createHash('sha256').update(curp).digest('hex');
  }
}
