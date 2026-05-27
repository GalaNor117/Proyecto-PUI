import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReporteActivo } from '../entities/reporte-activo.entity';

@Injectable()
export class ReporteActivoRepository {
  constructor(
    @InjectRepository(ReporteActivo)
    private readonly repo: Repository<ReporteActivo>,
  ) {}

  async save(reporte: Partial<ReporteActivo>): Promise<ReporteActivo> {
    return this.repo.save(reporte as ReporteActivo);
  }

  async findById(id: string): Promise<ReporteActivo | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActivos(): Promise<ReporteActivo[]> {
    return this.repo.find({ where: { activo: true } });
  }

  async findActivoByCurp(curp: string): Promise<ReporteActivo | null> {
    return this.repo.findOne({ where: { curp, activo: true } });
  }

  async findAll(options: {
    pagina: number;
    limite: number;
    activo?: boolean;
    busqueda?: string;
  }): Promise<{ datos: ReporteActivo[]; total: number }> {
    const qb = this.repo.createQueryBuilder('r');
    if (options.activo !== undefined) qb.andWhere('r.activo = :activo', { activo: options.activo });
    if (options.busqueda) {
      qb.andWhere(
        '(r.curp ILIKE :b OR r.nombre ILIKE :b OR r.primer_apellido ILIKE :b)',
        { b: `%${options.busqueda}%` },
      );
    }
    const [datos, total] = await qb
      .skip((options.pagina - 1) * options.limite)
      .take(options.limite)
      .orderBy('r.fecha_activacion', 'DESC')
      .getManyAndCount();
    return { datos, total };
  }

  async desactivar(id: string): Promise<void> {
    await this.repo.update(id, { activo: false, fechaDesactivacion: new Date() });
  }

  async actualizarRevision(id: string, fecha: Date): Promise<void> {
    await this.repo.update(id, { ultimaRevisionFase3: fecha });
  }

  async marcarFase1(id: string): Promise<void> {
    await this.repo.update(id, { fase1Completada: true });
  }

  async marcarFase2(id: string): Promise<void> {
    await this.repo.update(id, { fase2Completada: true });
  }

  async countActivos(): Promise<number> {
    return this.repo.count({ where: { activo: true } });
  }

  async countTotal(): Promise<number> {
    return this.repo.count();
  }

  async countEstaSemana(): Promise<number> {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return this.repo
      .createQueryBuilder('r')
      .where('r.fecha_activacion >= :desde', { desde: hace7Dias })
      .getCount();
  }
}
