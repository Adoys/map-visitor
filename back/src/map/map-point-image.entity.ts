import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MapPoint } from './map-point.entity';

@Entity('map_point_images')
export class MapPointImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'map_point_id' })
  mapPointId: number;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText?: string | null;

  @ManyToOne(() => MapPoint, (point) => point.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'map_point_id' })
  mapPoint: MapPoint;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
