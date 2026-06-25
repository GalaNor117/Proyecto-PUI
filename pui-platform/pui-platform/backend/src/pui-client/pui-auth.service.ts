import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { createClient } from 'redis';

@Injectable()
export class PuiAuthService {
  private readonly logger = new Logger(PuiAuthService.name);
  private readonly CACHE_KEY = 'pui:token';
  private redisClient: ReturnType<typeof createClient> | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private async getRedis() {
    if (!this.redisClient) {
      this.redisClient = createClient({ url: this.config.get<string>('REDIS_URL') });
      await this.redisClient.connect();
    }
    return this.redisClient;
  }

  async getToken(): Promise<string> {
    const redis = await this.getRedis();
    const cached = await redis.get(this.CACHE_KEY);
    if (cached) return cached;
    return this.renovarToken();
  }

  async renovarToken(): Promise<string> {
    const baseUrl = this.config.get<string>('PUI_BASE_URL')!;
    const body = {
      institucion_id: this.config.get<string>('RFC_INSTITUCION'),
      clave: this.config.get<string>('CLAVE_PUI_LOGIN'),
    };

    const response = await firstValueFrom(
      this.httpService.post<{ token: string }>(`${baseUrl}/login`, body, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }),
    );

    const token = response.data.token;
    const decoded = this.decodeJwtPayload(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    const ttl = Math.floor(expiresIn * 0.8);

    const redis = await this.getRedis();
    await redis.set(this.CACHE_KEY, token, { EX: ttl });

    this.logger.log(`Token PUI renovado. TTL cache: ${ttl}s`);
    return token;
  }

  private decodeJwtPayload(token: string): { exp: number } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Token JWT inválido');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload as { exp: number };
  }
}
