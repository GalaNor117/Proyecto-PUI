import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioPanel } from '../entities/usuario-panel.entity';

@Injectable()
export class UsuarioPanelRepository {
  constructor(
    @InjectRepository(UsuarioPanel)
    private readonly repo: Repository<UsuarioPanel>,
  ) {}

  async findByUsername(username: string): Promise<UsuarioPanel | null> {
    return this.repo.findOne({ where: { username, activo: true } });
  }

  async save(data: Partial<UsuarioPanel>): Promise<UsuarioPanel> {
    return this.repo.save(data as UsuarioPanel);
  }
}
