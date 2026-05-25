import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { MapPointImage } from './map-point-image.entity';
import { MapPointTranslation } from './map-point-translation.entity';

@Entity('map_points')
export class MapPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column()
  description: string;

  @Column()
  type: 'interest' | 'info';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  x: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  y: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => MapPointImage, (image) => image.mapPoint)
  images?: MapPointImage[];

  @OneToMany(() => MapPointTranslation, (translation) => translation.mapPoint)
  translations?: MapPointTranslation[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
