import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TipoDocumento } from '../tipos-documento/tipo-documento.entity';

export enum EstadoDocumento {
  BORRADOR = 'BORRADOR',
  PENDIENTE_SUBIDA = 'PENDIENTE_SUBIDA',
  PDF_SUBIDO = 'PDF_SUBIDO',
  EN_FLUJO = 'EN_FLUJO',
}

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Referencia al id de hojas_ruta en safda_plataforma.
   * Se almacena solo el UUID, sin FK cross-service.
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  hoja_ruta_id!: string | null;

  @ManyToOne(() => TipoDocumento, { eager: true, nullable: false })
  @JoinColumn({ name: 'tipo_documento_id' })
  tipo_documento!: TipoDocumento;

  @Column({ type: 'varchar', length: 255 })
  nombre_archivo!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  area!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  archivo_path!: string | null;

  /** UUID único para generar el QR del documento */
  @Column({ type: 'varchar', length: 36, nullable: true })
  qr_id!: string | null;

  /** Site generado: ej. "DAF-0042/2026" */
  @Column({ type: 'varchar', length: 30, nullable: true })
  site_generado!: string | null;

  @Column({
    type: 'enum',
    enum: EstadoDocumento,
    default: EstadoDocumento.BORRADOR,
  })
  estado!: EstadoDocumento;

  /** ID del usuario que creó el documento (referencia sin FK cross-service) */
  @Column({ type: 'varchar', length: 36 })
  creado_por!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
