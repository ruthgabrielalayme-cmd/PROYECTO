import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Rol, EstadoUsuario } from './usuario.entity';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  nombre_completo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  area?: string;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;
}
