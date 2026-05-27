import {
  IsString, IsOptional, MinLength, MaxLength, Matches,
  IsDateString, IsIn,
} from 'class-validator';

export class ActivarReporteDto {
  @IsString()
  @MinLength(36)
  @MaxLength(75)
  id: string;

  @IsString()
  @Matches(/^[A-Z0-9]{18}$/)
  curp: string;

  @IsString()
  @MinLength(1)
  lugar_nacimiento: string;

  @IsOptional() @IsString() @MaxLength(50) nombre?: string;
  @IsOptional() @IsString() @MaxLength(50) primer_apellido?: string;
  @IsOptional() @IsString() @MaxLength(50) segundo_apellido?: string;
  @IsOptional() @IsDateString() fecha_nacimiento?: string;
  @IsOptional() @IsDateString() fecha_desaparicion?: string;
  @IsOptional() @IsString() @IsIn(['H', 'M', 'X']) sexo_asignado?: string;
  @IsOptional() @IsString() @MaxLength(15) telefono?: string;
  @IsOptional() @IsString() @MaxLength(50) correo?: string;
  @IsOptional() @IsString() @MaxLength(500) direccion?: string;
  @IsOptional() @IsString() @MaxLength(50) calle?: string;
  @IsOptional() @IsString() @MaxLength(20) numero?: string;
  @IsOptional() @IsString() @MaxLength(50) colonia?: string;
  @IsOptional() @IsString() @MaxLength(5) codigo_postal?: string;
  @IsOptional() @IsString() @MaxLength(100) municipio_o_alcaldia?: string;
  @IsOptional() @IsString() @MaxLength(40) entidad_federativa?: string;
}
