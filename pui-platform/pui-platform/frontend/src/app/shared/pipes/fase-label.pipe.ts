import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'faseLabel', standalone: true })
export class FaseLabelPipe implements PipeTransform {
  transform(fase: string | number): string {
    const map: Record<string, string> = { '1': 'Fase 1 - Básica', '2': 'Fase 2 - Histórica', '3': 'Fase 3 - Continua' };
    return map[String(fase)] ?? `Fase ${fase}`;
  }
}
