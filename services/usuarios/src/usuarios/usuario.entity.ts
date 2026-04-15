import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export enum Rol {
  FUNCIONARIO = 'FUNCIONARIO',
  ENCARGADO = 'ENCARGADO',
  ADMIN = 'ADMIN',
}

export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  PENDIENTE_ASIGNACION = 'PENDIENTE_ASIGNACION',
  INACTIVO = 'INACTIVO',
}

export enum Provider {
  CIUDADANIA_DIGITAL = 'CIUDADANIA_DIGITAL',
  GOOGLE = 'GOOGLE',
}

@Entity('usuarios')
@Unique(['provider', 'provider_sub'])
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correo!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  nombre_completo!: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  foto_url!: string | null;

  /** Solo Ciudadanía Digital puede proveer el documento de identidad */
  @Column({ type: 'varchar', length: 20, nullable: true })
  documento_identidad!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  celular!: string | null;

  /** Asignado por admin: DAF, RRHH, LEGAL, etc. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  area!: string | null;

  @Column({
    type: 'enum',
    enum: Rol,
    default: Rol.FUNCIONARIO,
  })
  rol!: Rol;

  @Column({
    type: 'enum',
    enum: EstadoUsuario,
    default: EstadoUsuario.PENDIENTE_ASIGNACION,
  })
  estado!: EstadoUsuario;

  @Column({
    type: 'enum',
    enum: Provider,
  })
  provider!: Provider;

  /** Identificador estable 'sub' del proveedor externo */
  @Column({ type: 'varchar', length: 255 })
  provider_sub!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
