export interface DatosBasicosPersona {
  curp: string;
  nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  sexo_asignado?: string;
  telefono?: string;
  correo?: string;
  domicilio?: {
    direccion?: string;
    calle?: string;
    numero?: string;
    colonia?: string;
    codigo_postal?: string;
    municipio_o_alcaldia?: string;
    entidad_federativa?: string;
  };
  fotos?: Buffer[];
  formato_fotos?: string;
  huellas?: Partial<Record<
    'rone' | 'rtwo' | 'rthree' | 'rfour' | 'rfive' |
    'lone' | 'ltwo' | 'lthree' | 'lfour' | 'lfive' |
    'rpalm' | 'lpalm',
    Buffer
  >>;
  formato_huellas?: string;
}

export interface EventoHistorico extends DatosBasicosPersona {
  tipo_evento: string;
  fecha_evento: string;
  descripcion_lugar_evento?: string;
  direccion_evento?: {
    direccion?: string;
    calle?: string;
    numero?: string;
    colonia?: string;
    codigo_postal?: string;
    municipio_o_alcaldia?: string;
    entidad_federativa?: string;
  };
}

export interface SistemaInternoRepository {
  buscarDatosBasicos(curp: string): Promise<DatosBasicosPersona | null>;
  buscarEventosHistoricos(curp: string, desde: Date, hasta: Date): Promise<EventoHistorico[]>;
  buscarEventosNuevos(curp: string, desde: Date): Promise<EventoHistorico[]>;
}

export const SISTEMA_INTERNO_REPOSITORY = 'SISTEMA_INTERNO_REPOSITORY';
