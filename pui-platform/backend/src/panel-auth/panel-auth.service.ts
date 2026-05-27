import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioPanelRepository } from '../database/repositories/usuario-panel.repository';

@Injectable()
export class PanelAuthService {
  constructor(
    private readonly usuarioRepo: UsuarioPanelRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ token: string }> {
    const usuario = await this.usuarioRepo.findByUsername(username);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwtService.sign({ sub: usuario.id, username: usuario.username });
    return { token };
  }
}
