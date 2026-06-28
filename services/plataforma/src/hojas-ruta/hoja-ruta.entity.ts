import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Derivacion } from '../derivaciones/derivacion.entity';
import { Bandeja } from '../bandejas/bandeja.entity';

export enum EstadoHojaRuta {
  ABIERTA = 'ABIERTA',
  EN_PROCESO = 'EN_PROCESO',
  CERRADA = 'CERRADA',
  ARCHIVADA = 'ARCHIVADA',
}

@Entity('hojas_ruta')
export class HojaRuta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  codigo!: string;

  @Column({ type: 'varchar', length: 50 })
  area_origen!: string;

  @Column({
    type: 'enum',
    enum: EstadoHojaRuta,
    default: EstadoHojaRuta.ABIERTA,
  })
  estado!: EstadoHojaRuta;

  /** ID del usuario que creó la HR (referencia sin FK cross-service) */
  @Column({ type: 'varchar', length: 36 })
  creado_por!: string;

  @OneToMany(() => Derivacion, (d) => d.hoja_ruta)
  derivaciones!: Derivacion[];

  @OneToMany(() => Bandeja, (b) => b.hoja_ruta)
  bandejas!: Bandeja[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Propiedades enriquecidas en tiempo de ejecución (no persisten en BD)
  creado_por_nombre?: string | null;
}
