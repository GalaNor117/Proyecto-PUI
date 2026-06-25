export interface NotificarCoincidenciaDto {
  curp: string;
  lugar_nacimiento: string;
  id: string;
  institucion_id: string;
  fase_busqueda: '1' | '2' | '3';
  nombre_completo?: { nombre?: string; primer_apellido?: string; segundo_apellido?: string };
  fecha_nacimiento?: string;
  sexo_asignado?: string;
  telefono?: string;
  correo?: string;
  domicilio?: {
    direccion?: string; calle?: string; numero?: string; colonia?: string;
    codigo_postal?: string; municipio_o_alcaldia?: string; entidad_federativa?: string;
  };
  tipo_evento?: string;
  fecha_evento?: string;
  descripcion_lugar_evento?: string;
  direccion_evento?: {
    direccion?: string; calle?: string; numero?: string; colonia?: string;
    codigo_postal?: string; municipio_o_alcaldia?: string; entidad_federativa?: string;
  };
  fotos?: string[];
  formato_fotos?: string;
  huellas?: Record<string, string>;
  formato_huellas?: string;
}
