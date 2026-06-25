import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coincidencia } from '../entities/coincidencia.entity';

@Injectable()
export class CoincidenciaRepository {
  constructor(
    @InjectRepository(Coincidencia)
    private readonly repo: Repository<Coincidencia>,
  ) {}

  async save(data: Partial<Coincidencia>): Promise<Coincidencia> {
    return this.repo.save(data as Coincidencia);
  }

  async findAll(options: {
    pagina: number;
    limite: number;
    reporteId?: string;
    fase?: string;
    desde?: string;
  }): Promise<{ datos: Coincidencia[]; total: number }> {
    const qb = this.repo.createQueryBuilder('c');
    if (options.reporteId) qb.andWhere('c.reporte_id = :id', { id: options.reporteId });
    if (options.fase) qb.andWhere('c.fase_busqueda = :fase', { fase: options.fase });
    if (options.desde) qb.andWhere('c.enviado_en >= :desde', { desde: options.desde });
    const [datos, total] = await qb
      .skip((options.pagina - 1) * options.limite)
      .take(options.limite)
      .orderBy('c.enviado_en', 'DESC')
      .getManyAndCount();
    return { datos, total };
  }

  async countTotal(): Promise<number> {
    return this.repo.count();
  }

  async countPorFase(): Promise<{ fase1: number; fase2: number; fase3: number }> {
    const rows = await this.repo
      .createQueryBuilder('c')
      .select('c.fase_busqueda', 'fase')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('c.fase_busqueda')
      .getRawMany<{ fase: string; cnt: string }>();
    const map: Record<string, number> = {};
    rows.forEach(r => (map[r.fase] = parseInt(r.cnt, 10)));
    return { fase1: map['1'] ?? 0, fase2: map['2'] ?? 0, fase3: map['3'] ?? 0 };
  }

  async countEsteMes(): Promise<number> {
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    return this.repo
      .createQueryBuilder('c')
      .where('c.enviado_en >= :inicio', { inicio })
      .getCount();
  }

  async findByReporteId(reporteId: string): Promise<Coincidencia[]> {
    return this.repo.find({ where: { reporteId }, order: { enviadoEn: 'ASC' } });
  }
}
