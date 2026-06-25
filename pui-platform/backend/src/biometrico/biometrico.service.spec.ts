import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BiometricoService } from './biometrico.service';

const TEST_KEY = Buffer.alloc(32, 0).toString('base64');

describe('BiometricoService', () => {
  let service: BiometricoService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BiometricoService,
        { provide: ConfigService, useValue: { get: () => TEST_KEY } },
      ],
    }).compile();
    service = module.get(BiometricoService);
  });

  it('cifra y produce base64 válido', async () => {
    const datos = Buffer.from('test data');
    const resultado = await service.cifrarFotos([datos], 'jpg');
    expect(resultado.formato_fotos).toBe('jpg');
    expect(resultado.fotos).toHaveLength(1);
    expect(() => Buffer.from(resultado.fotos[0], 'base64')).not.toThrow();
  });

  it('rechaza fotos mayores a 240 KB', async () => {
    const grande = Buffer.alloc(241 * 1024);
    await expect(service.cifrarFotos([grande], 'jpg')).rejects.toThrow('240 KB');
  });

  it('cifra huellas correctamente', async () => {
    const huella = Buffer.from('fingerprint data');
    const resultado = await service.cifrarHuellas({ rone: huella }, 'wsq');
    expect(resultado.huellas['rone']).toBeDefined();
    expect(resultado.formato_huellas).toBe('wsq');
  });

  it('el cifrado produce iv(12) + authTag(16) + datos', async () => {
    const datos = Buffer.from('hello');
    const resultado = await service.cifrarFotos([datos], 'png');
    const cifrado = Buffer.from(resultado.fotos[0], 'base64');
    expect(cifrado.length).toBeGreaterThanOrEqual(12 + 16 + 1);
  });

  it('cifrados diferentes para el mismo dato (IV aleatorio)', async () => {
    const datos = Buffer.from('same data');
    const r1 = await service.cifrarFotos([datos], 'jpg');
    const r2 = await service.cifrarFotos([datos], 'jpg');
    expect(r1.fotos[0]).not.toBe(r2.fotos[0]);
  });
});
