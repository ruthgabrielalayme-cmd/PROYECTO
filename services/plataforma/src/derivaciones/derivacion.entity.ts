import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HojaRuta } from '../hojas-ruta/hoja-ruta.entity';

export enum EstadoDerivacion {
  PENDIENTE_APROBACION = 'PENDIENTE_APROBACION',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  ENVIADA = 'ENVIADA',
  RECIBIDA = 'RECIBIDA',
}

@Entity('derivaciones')
export class Derivacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => HojaRuta, (hr) => hr.derivaciones, { nullable: false })
  @JoinColumn({ name: 'hoja_ruta_id' })
  hoja_ruta!: HojaRuta;

  /** Referencia al documento en safda_documentos, sin FK cross-service */
  @Column({ type: 'varchar', length: 36 })
  documento_id!: string;

  @Column({ type: 'varchar', length: 36 })
  remitente_id!: string;

  @Column({ type: 'varchar', length: 36 })
  destinatario_id!: string;

  @Column({ type: 'boolean', default: false })
  es_externa!: boolean;

  @Column({
    type: 'enum',
    enum: EstadoDerivacion,
    default: EstadoDerivacion.PENDIENTE_APROBACION,
  })
  estado!: EstadoDerivacion;

  @Column({ type: 'text', nullable: true })
  nota!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Propiedades enriquecidas en tiempo de ejecución (no persisten en BD)
  remitente_nombre?: string | null;
  destinatario_nombre?: string | null;
  documento_nombre?: string | null;
}
