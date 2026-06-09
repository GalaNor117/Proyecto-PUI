import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BiometricoService } from '../biometrico/biometrico.service';
import { DatosBasicosPersona, EventoHistorico } from '../sistema-interno/sistema-interno.repository.interface';
import { ActivarReporteDto } from '../webhook/dto/activar-reporte.dto';
import { ReporteActivo } from '../database/entities/reporte-activo.entity';
import { NotificarCoincidenciaDto } from '../pui-client/dto/notificar-coincidencia.dto';

type ReporteRef = ActivarReporteDto | ReporteActivo;

function getField<K extends keyof ActivarReporteDto>(r: ReporteRef, key: K): string | undefined {
  if (r instanceof ReporteActivo) {
    const map: Partial<Record<keyof ActivarReporteDto, keyof ReporteActivo>> = {
      id: 'id', curp: 'curp', lugar_nacimiento: 'lugarNacimiento',
      nombre: 'nombre', primer_apellido: 'primerApellido', segundo_apellido: 'segundoApellido',
      fecha_nacimiento: 'fechaNacimiento', fecha_desaparicion: 'fechaDesaparicion',
      sexo_asignado: 'sexoAsignado', telefono: 'telefono', correo: 'correo',
    };
    const entityKey = map[key];
    if (entityKey) {
      const val = r[entityKey];
      return val instanceof Date ? val.toISOString().split('T')[0] : val as string | undefined;
    }
    return undefined;
  }
  return (r as ActivarReporteDto)[key] as string | undefined;
}

@Injectable()
export class CoincidenciaMapper {
  constructor(
    private readonly config: ConfigService,
    private readonly biometrico: BiometricoService,
  ) {}

  async toDto(
    datos: DatosBasicosPersona | EventoHistorico,
    reporte: ReporteRef,
    incluirEvento = false,
  ): Promise<Partial<NotificarCoincidenciaDto>> {
    const payload: Partial<NotificarCoincidenciaDto> = {
      curp: getField(reporte, 'curp') ?? datos.curp,
      lugar_nacimiento: getField(reporte, 'lugar_nacimiento') ?? '',
      id: getField(reporte, 'id') ?? '',
      institucion_id: this.config.get<string>('RFC_INSTITUCION')!,
    };

    if (datos.nombre || datos.primer_apellido || datos.segundo_apellido) {
      payload.nombre_completo = {
        nombre: datos.nombre,
        primer_apellido: datos.primer_apellido,
        segundo_apellido: datos.segundo_apellido,
      };
    }
    if (datos.fecha_nacimiento) payload.fecha_nacimiento = datos.fecha_nacimiento;
    if (datos.sexo_asignado) payload.sexo_asignado = datos.sexo_asignado;
    if (datos.telefono) payload.telefono = datos.telefono;
    if (datos.correo) payload.correo = datos.correo;
    if (datos.domicilio) payload.domicilio = datos.domicilio;

    if (incluirEvento) {
      const evento = datos as EventoHistorico;
      if (evento.tipo_evento) payload.tipo_evento = evento.tipo_evento;
      if (evento.fecha_evento) payload.fecha_evento = evento.fecha_evento;
      if (evento.descripcion_lugar_evento) payload.descripcion_lugar_evento = evento.descripcion_lugar_evento;
      if (evento.direccion_evento) payload.direccion_evento = evento.direccion_evento;
    }

    if (datos.fotos?.length && datos.formato_fotos) {
      const cifradas = await this.biometrico.cifrarFotos(datos.fotos, datos.formato_fotos);
      payload.fotos = cifradas.fotos;
      payload.formato_fotos = cifradas.formato_fotos;
    }

    if (datos.huellas && datos.formato_huellas) {
      const cifradas = await this.biometrico.cifrarHuellas(datos.huellas, datos.formato_huellas);
      payload.huellas = cifradas.huellas;
      payload.formato_huellas = cifradas.formato_huellas;
    }

    return payload;
  }
}
