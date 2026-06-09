import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('reportes_activos')
export class ReporteActivo {
  @PrimaryColumn({ length: 75 })
  id: string;

  @Index()
  @Column({ length: 18 })
  curp: string;

  @Column({ length: 50, nullable: true })
  nombre?: string;

  @Column({ name: 'primer_apellido', length: 50, nullable: true })
  primerApellido?: string;

  @Column({ name: 'segundo_apellido', length: 50, nullable: true })
  segundoApellido?: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: Date;

  @Column({ name: 'fecha_desaparicion', type: 'date', nullable: true })
  fechaDesaparicion?: Date;

  @Column({ name: 'lugar_nacimiento', length: 20, nullable: true })
  lugarNacimiento?: string;

  @Column({ name: 'sexo_asignado', length: 1, nullable: true })
  sexoAsignado?: string;

  @Column({ length: 15, nullable: true })
  telefono?: string;

  @Column({ length: 50, nullable: true })
  correo?: string;

  @Column({ length: 500, nullable: true })
  direccion?: string;

  @Column({ length: 50, nullable: true })
  calle?: string;

  @Column({ length: 20, nullable: true })
  numero?: string;

  @Column({ length: 50, nullable: true })
  colonia?: string;

  @Column({ name: 'codigo_postal', length: 5, nullable: true })
  codigoPostal?: string;

  @Column({ name: 'municipio_o_alcaldia', length: 100, nullable: true })
  municipioOAlcaldia?: string;

  @Column({ name: 'entidad_federativa', length: 40, nullable: true })
  entidadFederativa?: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_activacion', type: 'timestamptz' })
  fechaActivacion: Date;

  @Column({ name: 'fecha_desactivacion', type: 'timestamptz', nullable: true })
  fechaDesactivacion?: Date;

  @Column({ name: 'ultima_revision_fase3', type: 'timestamptz', nullable: true })
  ultimaRevisionFase3?: Date;

  @Column({ name: 'fase1_completada', default: false })
  fase1Completada: boolean;

  @Column({ name: 'fase2_completada', default: false })
  fase2Completada: boolean;
}
