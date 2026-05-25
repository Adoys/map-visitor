import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_translation_phrases')
@Unique('uq_app_translation_phrases_language_key', ['languageCode', 'translationKey'])
export class AppTranslationPhrase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'language_code', length: 10 })
  languageCode: string;

  @Column({ name: 'translation_key', length: 160 })
  translationKey: string;

  @Column({ type: 'text' })
  value: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
