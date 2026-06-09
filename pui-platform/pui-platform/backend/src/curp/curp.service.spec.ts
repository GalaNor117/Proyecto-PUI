import { Test } from '@nestjs/testing';
import { CurpService } from './curp.service';

describe('CurpService', () => {
  let service: CurpService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({ providers: [CurpService] }).compile();
    service = module.get(CurpService);
  });

  it('mapea BC → BAJA CALIFORNIA', () => {
    expect(service.extraerLugarNacimiento('AAAA000101BCAAAA01')).toBe('BAJA CALIFORNIA');
  });
  it('mapea NE → FORÁNEO', () => {
    expect(service.extraerLugarNacimiento('AAAA000101NEAAAA01')).toBe('FORÁNEO');
  });
  it('devuelve DESCONOCIDO para código desconocido', () => {
    expect(service.extraerLugarNacimiento('AAAA000101ZZAAAA01')).toBe('DESCONOCIDO');
  });
  it('devuelve DESCONOCIDO para CURP inválida', () => {
    expect(service.extraerLugarNacimiento('CORTO')).toBe('DESCONOCIDO');
  });
  it('mapea DF → CDMX', () => {
    expect(service.extraerLugarNacimiento('AAAA000101DFAAAA01')).toBe('CDMX');
  });
  it('mapea todos los estados del anexo 5', () => {
    const estados: Record<string, string> = {
      AS:'AGUASCALIENTES', BC:'BAJA CALIFORNIA', BS:'BAJA CALIFORNIA SUR',
      CC:'CAMPECHE', CS:'CHIAPAS', CH:'CHIHUAHUA', DF:'CDMX', CL:'COAHUILA',
      CM:'COLIMA', DG:'DURANGO', GT:'GUANAJUATO', GR:'GUERRERO', HG:'HIDALGO',
      JC:'JALISCO', MC:'MÉXICO', MN:'MICHOACÁN', MS:'MORELOS', NT:'NAYARIT',
      NL:'NUEVO LEÓN', OC:'OAXACA', PL:'PUEBLA', QO:'QUERÉTARO', QR:'QUINTANA ROO',
      SP:'SAN LUIS POTOSÍ', SL:'SINALOA', SR:'SONORA', TC:'TABASCO',
      TS:'TAMAULIPAS', TL:'TLAXCALA', VZ:'VERACRUZ', YN:'YUCATÁN', ZS:'ZACATECAS',
    };
    for (const [codigo, esperado] of Object.entries(estados)) {
      const curp = `AAAA000101${codigo}AAAA01`;
      expect(service.extraerLugarNacimiento(curp)).toBe(esperado);
    }
  });
});
