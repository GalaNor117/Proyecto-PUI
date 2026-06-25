import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogInteraccion } from '../entities/log-interaccion.entity';

@Injectable()
export class LogInteraccionRepository {
  constructor(
    @InjectRepository(LogInteraccion)
    private readonly repo: Repository<LogInteraccion>,
  ) {}

  async save(data: Partial<LogInteraccion>): Promise<LogInteraccion> {
    return this.repo.save(data as LogInteraccion);
  }

  async findAll(options: {
    pagina: number;
    limite: number;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }): Promise<{ datos: LogInteraccion[]; total: number }> {
    const qb = this.repo.createQueryBuilder('l');
    if (options.tipo) qb.andWhere('l.tipo = :tipo', { tipo: options.tipo });
    if (options.desde) qb.andWhere('l.timestamp >= :desde', { desde: options.desde });
    if (options.hasta) qb.andWhere('l.timestamp <= :hasta', { hasta: options.hasta });
    const [datos, total] = await qb
      .skip((options.pagina - 1) * options.limite)
      .take(options.limite)
      .orderBy('l.timestamp', 'DESC')
      .getManyAndCount();
    return { datos, total };
  }
}
