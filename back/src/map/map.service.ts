import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname, join } from 'path';
import { promises as fs } from 'fs';
import { Multer } from 'multer';
import { MapPoint } from './map-point.entity';
import { MapPointImage } from './map-point-image.entity';
import { MapPointTranslation } from './map-point-translation.entity';
import { CreateMapPointDto } from './dto/create-map-point.dto';
import { UpdateMapPointPositionDto } from './dto/update-map-point-position.dto';
import { UpsertMapPointTranslationDto } from './dto/upsert-map-point-translation.dto';
import { UpdateMapPointImageDto } from './dto/update-map-point-image.dto';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class MapPointsService {
  constructor(
    @InjectRepository(MapPoint)
    private readonly mapPointRepo: Repository<MapPoint>,
    @InjectRepository(MapPointImage)
    private readonly mapPointImageRepo: Repository<MapPointImage>,
    @InjectRepository(MapPointTranslation)
    private readonly mapPointTranslationRepo: Repository<MapPointTranslation>,
    private readonly configService: ConfigService,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  async findAll(): Promise<MapPoint[]> {
    return this.mapPointRepo.find({ relations: ['user'] });
  }

  async create(createMapPointDto: CreateMapPointDto): Promise<MapPoint> {
    const mapPoint = this.mapPointRepo.create(createMapPointDto);
    const savedPoint = await this.mapPointRepo.save(mapPoint);
    this.notificationsGateway.emitMapPointsUpdated({
      action: 'created',
      pointId: savedPoint.id,
    });
    return savedPoint;
  }

  async delete(id: number): Promise<void> {
    await this.mapPointRepo.delete(id);
    this.notificationsGateway.emitMapPointsUpdated({
      action: 'deleted',
      pointId: id,
    });
  }

  async updatePosition(id: number, dto: UpdateMapPointPositionDto): Promise<MapPoint> {
    const point = await this.mapPointRepo.findOne({ where: { id } });
    if (!point) {
      throw new NotFoundException('Map point not found');
    }

    point.x = dto.x;
    point.y = dto.y;
    const savedPoint = await this.mapPointRepo.save(point);
    this.notificationsGateway.emitMapPointsUpdated({
      action: 'position-updated',
      pointId: savedPoint.id,
    });
    return savedPoint;
  }

  async getContent(id: number, languageCode?: string) {
    const point = await this.mapPointRepo.findOne({ where: { id } });
    if (!point) {
      throw new NotFoundException('Map point not found');
    }

    const [images, translations] = await Promise.all([
      this.mapPointImageRepo.find({
        where: { mapPointId: id },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
      this.mapPointTranslationRepo.find({
        where: { mapPointId: id },
        order: { languageCode: 'ASC' },
      }),
    ]);

    const translation =
      translations.find((item) => item.languageCode === languageCode) ??
      translations[0] ??
      null;

    return {
      point,
      images,
      translations,
      translation,
    };
  }

  async upsertTranslation(id: number, dto: UpsertMapPointTranslationDto) {
    await this.ensurePointExists(id);

    const existing = await this.mapPointTranslationRepo.findOne({
      where: { mapPointId: id, languageCode: dto.languageCode },
    });

    if (existing) {
      existing.title = dto.title;
      existing.descriptionHtml = dto.descriptionHtml ?? null;
      return this.mapPointTranslationRepo.save(existing);
    }

    return this.mapPointTranslationRepo.save(
      this.mapPointTranslationRepo.create({
        mapPointId: id,
        languageCode: dto.languageCode,
        title: dto.title,
        descriptionHtml: dto.descriptionHtml ?? null,
      }),
    );
  }

  async uploadImage(id: number, file: Multer.File): Promise<MapPointImage> {
    await this.ensurePointExists(id);
    const imageUrl = await this.saveFileImage(file, 'map-point');
    const maxSort = await this.mapPointImageRepo.maximum('sortOrder', {
      mapPointId: id,
    });

    return this.mapPointImageRepo.save(
      this.mapPointImageRepo.create({
        mapPointId: id,
        imageUrl,
        sortOrder: (maxSort ?? -1) + 1,
      }),
    );
  }

  async updateImage(imageId: number, dto: UpdateMapPointImageDto) {
    const image = await this.mapPointImageRepo.findOne({ where: { id: imageId } });
    if (!image) {
      throw new NotFoundException('Map point image not found');
    }

    if (dto.altText !== undefined) image.altText = dto.altText;
    if (dto.sortOrder !== undefined) image.sortOrder = dto.sortOrder;

    return this.mapPointImageRepo.save(image);
  }

  async deleteImage(imageId: number): Promise<void> {
    await this.mapPointImageRepo.delete(imageId);
  }

  private async ensurePointExists(id: number): Promise<void> {
    const exists = await this.mapPointRepo.exists({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Map point not found');
    }
  }

  private getUploadDir(): string {
    return join(__dirname, '..', '..', 'public', 'uploads', 'map-points');
  }

  private getBaseUrl(): string {
    const protocol = this.configService.get<string>('APP_PROTOCOL', 'http');
    const host = this.configService.get<string>('APP_HOST', 'localhost');
    const port = this.configService.get<string>('APP_PORT', '3000');
    return `${protocol}://${host}:${port}`;
  }

  private async saveFileImage(file: Multer.File, prefix: string): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Archivo de imagen inválido');
    }

    const uploadDir = this.getUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    let extension = extname(file.originalname).toLowerCase().replace('.', '');
    if (!extension) {
      const mimetype = file.mimetype;
      if (mimetype === 'image/png') extension = 'png';
      else if (mimetype === 'image/jpeg') extension = 'jpg';
      else if (mimetype === 'image/webp') extension = 'webp';
      else if (mimetype === 'image/gif') extension = 'gif';
      else throw new BadRequestException('Tipo de archivo no soportado');
    }

    const allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    if (!allowed.includes(extension)) {
      throw new BadRequestException('Tipo de archivo no soportado');
    }

    if (extension === 'jpeg') extension = 'jpg';

    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const filePath = join(uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);

    return `${this.getBaseUrl()}/public/uploads/map-points/${filename}`;
  }
}
