import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { HojaRuta } from '../hojas-ruta/hoja-ruta.entity';

export enum TipoBandeja {
  ENTRANTE = 'ENTRANTE',
  SALIENTE = 'SALIENTE',
  PENDIENTE_APROBACION = 'PENDIENTE_APROBACION',
}

@Entity('bandejas')
export class Bandeja {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  usuario_id!: string;

  @ManyToOne(() => HojaRuta, (hr) => hr.bandejas, { nullable: false })
  @JoinColumn({ name: 'hoja_ruta_id' })
  hoja_ruta!: HojaRuta;

  @Column({ type: 'enum', enum: TipoBandeja })
  tipo!: TipoBandeja;

  @Column({ type: 'boolean', default: false })
  leido!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
