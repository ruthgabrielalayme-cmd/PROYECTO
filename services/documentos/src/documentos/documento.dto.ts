import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDocumentoDto {
  @IsUUID()
  tipo_documento_id!: string;

  @IsOptional()
  @IsUUID()
  hoja_ruta_id?: string;

  /** El nombre base del archivo; el backend añade el identificador */
  @IsString()
  @IsNotEmpty()
  nombre_base!: string;

  /** UUID del usuario que crea el documento (viene del JWT) */
  @IsUUID()
  creado_por!: string;
}

export class SubirPdfDto {
  /** Site previamente calculado por plataforma, ej. "DAF-0042/2026" */
  @IsString()
  @IsNotEmpty()
  site!: string;
}
