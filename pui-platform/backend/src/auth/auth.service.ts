import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  login(usuario: string, clave: string): { token: string } {
    if (usuario !== 'PUI') {
      throw new UnauthorizedException('Usuario inválido');
    }
    const claveEsperada = this.config.get<string>('CLAVE_WEBHOOK')!;
    if (clave !== claveEsperada) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const token = this.jwtService.sign({ sub: 'PUI', role: 'webhook' });
    return { token };
  }
}
