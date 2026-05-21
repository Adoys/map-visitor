import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'phone_is_whatsapp', type: 'boolean', nullable: true })
  phoneIsWhatsApp?: boolean;

  @Column({ nullable: true })
  email?: string;

  @Column({ name: 'background_color', nullable: true })
  backgroundColor?: string;

  @Column({ name: 'header_color', nullable: true })
  headerColor?: string;

  @Column({ name: 'button_color', nullable: true })
  buttonColor?: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'map_image_url', type: 'text', nullable: true })
  mapImageUrl?: string;

  @Column({ name: 'map_width', type: 'int', nullable: true })
  mapWidth?: number;

  @Column({ name: 'map_height', type: 'int', nullable: true })
  mapHeight?: number;

  @Column({ name: 'info_marker_icon_url', type: 'text', nullable: true })
  infoMarkerIconUrl?: string;

  @Column({ name: 'tourist_marker_icon_url', type: 'text', nullable: true })
  touristMarkerIconUrl?: string;
}
