import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapPoint } from './map-point.entity';
import { MapPointImage } from './map-point-image.entity';
import { MapPointTranslation } from './map-point-translation.entity';
import { MapPointsService } from './map.service';
import { MapController } from './map.controller';
import { NotificationsModule } from '../notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapPoint, MapPointImage, MapPointTranslation]),
    NotificationsModule,
  ],
  providers: [MapPointsService],
  controllers: [MapController],
})
export class MapModule { }
