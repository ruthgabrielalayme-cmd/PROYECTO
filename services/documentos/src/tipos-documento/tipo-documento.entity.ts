import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('tipo_documento')
export class TipoDocumento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  /** Ruta al archivo plantilla en el servidor (ej. ./plantillas/MEMORANDUM.docx) */
  @Column({ type: 'varchar', length: 512, nullable: true })
  plantilla_path!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
