import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PuiAuthService } from './pui-auth.service';
import { NotificarCoincidenciaDto } from './dto/notificar-coincidencia.dto';
import { BusquedaFinalizadaDto } from './dto/busqueda-finalizada.dto';
import { ReporteActivo } from '../database/entities/reporte-activo.entity';

@Injectable()
export class PuiClientService {
  private readonly logger = new Logger(PuiClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly puiAuth: PuiAuthService,
  ) {}

  private get baseUrl(): string {
    return this.config.get<string>('PUI_BASE_URL')!;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.puiAuth.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  async notificarCoincidencia(dto: NotificarCoincidenciaDto): Promise<number> {
    const headers = await this.headers();
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/notificar-coincidencia`, dto, { headers }),
    );
    return response.status;
  }

  async busquedaFinalizada(dto: BusquedaFinalizadaDto): Promise<void> {
    const headers = await this.headers();
    await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/busqueda-finalizada`, dto, { headers }),
    );
  }

  async getReportes(): Promise<ReporteActivo[]> {
    const headers = await this.headers();
    const response = await firstValueFrom(
      this.httpService.get<ReporteActivo[]>(`${this.baseUrl}/reportes`, { headers }),
    );
    return response.data;
  }
}
