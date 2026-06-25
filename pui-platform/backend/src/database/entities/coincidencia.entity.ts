import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ReporteActivo } from './reporte-activo.entity';

@Entity('coincidencias')
export class Coincidencia {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'reporte_id', length: 75 })
  reporteId: string;

  @ManyToOne(() => ReporteActivo)
  @JoinColumn({ name: 'reporte_id' })
  reporte: ReporteActivo;

  @Column({ name: 'fase_busqueda', length: 1 })
  faseBusqueda: string;

  @Column({ name: 'tipo_evento', length: 500, nullable: true })
  tipoEvento?: string;

  @Column({ name: 'fecha_evento', type: 'date', nullable: true })
  fechaEvento?: Date;

  @Column({ name: 'http_status', type: 'smallint', nullable: true })
  httpStatus?: number;

  @CreateDateColumn({ name: 'enviado_en', type: 'timestamptz' })
  enviadoEn: Date;

  @Column({ name: 'payload_resumen', type: 'jsonb', nullable: true })
  payloadResumen?: Record<string, unknown>;
}
