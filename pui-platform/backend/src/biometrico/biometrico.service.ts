import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createCipheriv } from 'crypto';

const MAX_FOTO_BYTES = 240 * 1024;

@Injectable()
export class BiometricoService {
  constructor(private readonly config: ConfigService) {}

  async cifrarFotos(
    fotos: Buffer[],
    formatoFotos: string,
  ): Promise<{ fotos: string[]; formato_fotos: string }> {
    for (const foto of fotos) {
      if (foto.length > MAX_FOTO_BYTES) {
        throw new Error(`Foto excede 240 KB (${foto.length} bytes)`);
      }
    }
    const cifradas = await Promise.all(fotos.map(f => this.cifrar(f)));
    return { fotos: cifradas, formato_fotos: formatoFotos };
  }

  async cifrarHuellas(
    huellas: Partial<Record<string, Buffer>>,
    formatoHuellas: string,
  ): Promise<{ huellas: Record<string, string>; formato_huellas: string }> {
    const cifradas: Record<string, string> = {};
    for (const [etiqueta, buffer] of Object.entries(huellas)) {
      if (buffer) cifradas[etiqueta] = await this.cifrar(buffer);
    }
    return { huellas: cifradas, formato_huellas: formatoHuellas };
  }

  private async cifrar(buffer: Buffer): Promise<string> {
    const claveBase64 = this.config.get<string>('CLAVE_BIOMETRICOS')!;
    const clave = Buffer.from(claveBase64, 'base64');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', clave, iv);
    const cifrado = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, cifrado]).toString('base64');
  }
}
