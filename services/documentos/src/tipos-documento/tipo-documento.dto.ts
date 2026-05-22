import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTipoDocumentoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;
}
