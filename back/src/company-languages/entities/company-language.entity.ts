import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('company_languages')
export class CompanyLanguage {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ length: 10 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  flag: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
