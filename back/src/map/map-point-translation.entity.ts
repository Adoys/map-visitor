import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { MapPoint } from './map-point.entity';

@Entity('map_point_translations')
@Unique('uq_map_point_translations_point_language', ['mapPointId', 'languageCode'])
export class MapPointTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'map_point_id' })
  mapPointId: number;

  @Column({ name: 'language_code', length: 10 })
  languageCode: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'description_html', type: 'longtext', nullable: true })
  descriptionHtml?: string | null;

  @ManyToOne(() => MapPoint, (point) => point.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'map_point_id' })
  mapPoint: MapPoint;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
