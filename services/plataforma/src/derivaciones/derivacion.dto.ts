import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDerivacionDto {
  @IsUUID()
  hoja_ruta_id!: string;

  @IsUUID()
  documento_id!: string;

  @IsUUID()
  remitente_id!: string;

  @IsUUID()
  destinatario_id!: string;

  @IsBoolean()
  es_externa!: boolean;

  @IsOptional()
  @IsString()
  nota?: string;
}

export class RechazarDerivacionDto {
  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
