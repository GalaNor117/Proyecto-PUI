import { Injectable } from '@nestjs/common';
import {
  DatosBasicosPersona,
  EventoHistorico,
  SistemaInternoRepository,
} from '../sistema-interno.repository.interface';

@Injectable()
export class SistemaInternoStubRepository implements SistemaInternoRepository {
  async buscarDatosBasicos(_curp: string): Promise<null> {
    return null;
  }

  async buscarEventosHistoricos(
    _curp: string,
    _desde: Date,
    _hasta: Date,
  ): Promise<EventoHistorico[]> {
    return [];
  }

  async buscarEventosNuevos(_curp: string, _desde: Date): Promise<EventoHistorico[]> {
    return [];
  }
}
