import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';

@Entity('correlativos_site')
@Unique(['area', 'anio'])
export class CorrelativoSite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  area!: string;

  @Column({ type: 'int' })
  anio!: number;

  @Column({ type: 'int', default: 0 })
  ultimo!: number;
}
