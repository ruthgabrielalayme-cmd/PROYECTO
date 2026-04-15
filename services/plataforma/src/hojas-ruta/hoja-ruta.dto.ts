import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateHojaRutaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  area_origen!: string;

  /** UUID del usuario que crea la HR (del JWT) */
  @IsUUID()
  creado_por!: string;
}
