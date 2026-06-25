import { Injectable } from '@nestjs/common';

const MAPA_ESTADOS: Record<string, string> = {
  AS: 'AGUASCALIENTES',
  BC: 'BAJA CALIFORNIA',
  BS: 'BAJA CALIFORNIA SUR',
  CC: 'CAMPECHE',
  CS: 'CHIAPAS',
  CH: 'CHIHUAHUA',
  DF: 'CDMX',
  CL: 'COAHUILA',
  CM: 'COLIMA',
  DG: 'DURANGO',
  GT: 'GUANAJUATO',
  GR: 'GUERRERO',
  HG: 'HIDALGO',
  JC: 'JALISCO',
  MC: 'MÉXICO',
  MN: 'MICHOACÁN',
  MS: 'MORELOS',
  NT: 'NAYARIT',
  NL: 'NUEVO LEÓN',
  OC: 'OAXACA',
  PL: 'PUEBLA',
  QO: 'QUERÉTARO',
  QR: 'QUINTANA ROO',
  SP: 'SAN LUIS POTOSÍ',
  SL: 'SINALOA',
  SR: 'SONORA',
  TC: 'TABASCO',
  TS: 'TAMAULIPAS',
  TL: 'TLAXCALA',
  VZ: 'VERACRUZ',
  YN: 'YUCATÁN',
  ZS: 'ZACATECAS',
  NE: 'FORÁNEO',
};

@Injectable()
export class CurpService {
  extraerLugarNacimiento(curp: string): string {
    if (!curp || curp.length !== 18) return 'DESCONOCIDO';
    const codigo = curp.substring(11, 13).toUpperCase();
    return MAPA_ESTADOS[codigo] ?? 'DESCONOCIDO';
  }
}
