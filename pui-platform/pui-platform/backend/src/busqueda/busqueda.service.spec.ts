import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BusquedaService } from './busqueda.service';
import { BusquedaContinuaService } from './busqueda-continua.service';
import { CoincidenciaMapper } from './coincidencia.mapper';
import { PuiClientService } from '../pui-client/pui-client.service';
import { ReporteActivoRepository } from '../database/repositories/reporte-activo.repository';
import { CoincidenciaRepository } from '../database/repositories/coincidencia.repository';
import { AuditLoggerService } from '../logger/audit-logger.service';
import { SISTEMA_INTERNO_REPOSITORY } from '../sistema-interno/sistema-interno.repository.interface';

const mockRepo = {
  save: jest.fn().mockResolvedValue({ id: 'test-id', curp: 'AAAA000101BCAAAA01' }),
  marcarFase1: jest.fn().mockResolvedValue(undefined),
  marcarFase2: jest.fn().mockResolvedValue(undefined),
};
const mockCoincidenciaRepo = { save: jest.fn().mockResolvedValue({}) };
const mockPuiClient = {
  notificarCoincidencia: jest.fn().mockResolvedValue(200),
  busquedaFinalizada: jest.fn().mockResolvedValue(undefined),
};
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
const mockMapper = { toDto: jest.fn().mockResolvedValue({ curp: 'AAAA000101BCAAAA01' }) };
const mockContinua = { registrar: jest.fn().mockResolvedValue(undefined) };
const mockSistema = {
  buscarDatosBasicos: jest.fn().mockResolvedValue(null),
  buscarEventosHistoricos: jest.fn().mockResolvedValue([]),
  buscarEventosNuevos: jest.fn().mockResolvedValue([]),
};

describe('BusquedaService', () => {
  let service: BusquedaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusquedaService,
        { provide: ConfigService, useValue: { get: () => 'RFC123' } },
        { provide: SISTEMA_INTERNO_REPOSITORY, useValue: mockSistema },
        { provide: PuiClientService, useValue: mockPuiClient },
        { provide: ReporteActivoRepository, useValue: mockRepo },
        { provide: CoincidenciaRepository, useValue: mockCoincidenciaRepo },
        { provide: AuditLoggerService, useValue: mockAudit },
        { provide: CoincidenciaMapper, useValue: mockMapper },
        { provide: BusquedaContinuaService, useValue: mockContinua },
      ],
    }).compile();
    service = module.get(BusquedaService);
    jest.clearAllMocks();
    mockRepo.save.mockResolvedValue({ id: 'test-id', curp: 'AAAA000101BCAAAA01' });
  });

  it('persiste el reporte y llama busqueda-finalizada', async () => {
    await service.procesarReporteAsync({
      id: 'FUB-test-uuid', curp: 'AAAA000101BCAAAA01', lugar_nacimiento: 'BAJA CALIFORNIA',
    });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockPuiClient.busquedaFinalizada).toHaveBeenCalledTimes(1);
  });

  it('Fase 1 no llama PUI si adaptador devuelve null', async () => {
    mockSistema.buscarDatosBasicos.mockResolvedValue(null);
    await service.procesarReporteAsync({
      id: 'FUB-test-2', curp: 'AAAA000101BCAAAA01', lugar_nacimiento: 'BAJA CALIFORNIA',
    });
    expect(mockPuiClient.notificarCoincidencia).not.toHaveBeenCalled();
  });

  it('Fase 2 se omite si no hay fecha_desaparicion', async () => {
    await service.procesarReporteAsync({
      id: 'FUB-test-3', curp: 'AAAA000101BCAAAA01', lugar_nacimiento: 'BAJA CALIFORNIA',
    });
    expect(mockSistema.buscarEventosHistoricos).not.toHaveBeenCalled();
  });

  it('registra en scheduler Fase 3 al finalizar', async () => {
    await service.procesarReporteAsync({
      id: 'FUB-test-4', curp: 'AAAA000101BCAAAA01', lugar_nacimiento: 'BAJA CALIFORNIA',
    });
    expect(mockContinua.registrar).toHaveBeenCalledTimes(1);
  });

  it('Fase 2 llama buscarEventosHistoricos con rango de 12 años si tiene fecha_desaparicion', async () => {
    await service.procesarReporteAsync({
      id: 'FUB-test-5', curp: 'AAAA000101BCAAAA01', lugar_nacimiento: 'BAJA CALIFORNIA',
      fecha_desaparicion: '2023-01-01',
    });
    expect(mockSistema.buscarEventosHistoricos).toHaveBeenCalledTimes(1);
  });
});
