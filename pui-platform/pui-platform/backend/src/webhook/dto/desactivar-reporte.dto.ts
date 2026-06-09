import { IsString, MinLength, MaxLength } from 'class-validator';

export class DesactivarReporteDto {
  @IsString()
  @MinLength(36)
  @MaxLength(75)
  id: string;
}
