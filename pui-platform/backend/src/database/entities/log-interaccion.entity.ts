import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('log_interacciones')
export class LogInteraccion {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ length: 50 })
  tipo: string;

  @Index()
  @Column({ name: 'reporte_id', length: 75, nullable: true })
  reporteId?: string;

  @Column({ name: 'curp_hash', length: 64, nullable: true })
  curpHash?: string;

  @Column({ length: 100, nullable: true })
  endpoint?: string;

  @Column({ name: 'fase_busqueda', length: 1, nullable: true })
  faseBusqueda?: string;

  @Column({ name: 'http_status', type: 'smallint', nullable: true })
  httpStatus?: number;

  @Column({ name: 'error_mensaje', type: 'text', nullable: true })
  errorMensaje?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
