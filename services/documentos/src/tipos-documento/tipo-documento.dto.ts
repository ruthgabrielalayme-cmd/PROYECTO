import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTipoDocumentoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  plantilla_path?: string;
}
