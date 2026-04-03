import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join, extname } from 'path';
import { promises as fs } from 'fs';
import { Multer } from 'multer';
import { ConfigService } from '@nestjs/config';
import { CreateCompanySettingsDto } from './dto/create-company-settings.dto';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { CompanySettings } from './entities/company-settings.entity';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class CompanySettingsService {
  constructor(
    @InjectRepository(CompanySettings)
    private readonly repo: Repository<CompanySettings>,
    private readonly configService: ConfigService,
    private readonly notificationsGateway: NotificationsGateway,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async getSettings(): Promise<CompanySettings | null> {
    return this.repo.findOneBy({});
  }

  async getSettingsOrThrow(): Promise<CompanySettings> {
    const settings = await this.getSettings();
    if (!settings) throw new NotFoundException('Settings not found');
    return settings;
  }

  async create(dto: CreateCompanySettingsDto) {
    const existing = await this.repo.findOneBy({});
    if (existing) {
      throw new BadRequestException('Company settings already exist');
    }

    const data = await this.prepareSettingsPayload(dto);
    return this.repo.save(data);
  }

  async update(dto: UpdateCompanySettingsDto) {
    const existing = await this.getSettings();
    const data = await this.prepareSettingsPayload(dto);

    let updatedSettings: CompanySettings;
    if (existing) {
      Object.assign(existing, data);
      updatedSettings = await this.repo.save(existing);
    } else {
      // Si no existen ajustes aún, creamos uno nuevo
      updatedSettings = await this.repo.save(data as CompanySettings);
    }

    // Emitir notificación a todos los usuarios conectados
    this.notificationsGateway.emitSettingsUpdated(updatedSettings);

    return updatedSettings;
  }

  private getUploadDir(): string {
    return join(__dirname, '..', '..', 'public', 'uploads', 'company-settings');
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

    return `${this.getBaseUrl()}/public/uploads/company-settings/${filename}`;
  }

  async uploadLogo(file: Multer.File): Promise<CompanySettings> {
    const url = await this.saveFileImage(file, 'logo');
    const existing = await this.getSettings();

    if (existing) {
      existing.logoUrl = url;
      return this.repo.save(existing);
    }

    return this.repo.save({ logoUrl: url } as CompanySettings);
  }

  async uploadInfoMarkerIcon(file: Multer.File): Promise<CompanySettings> {
    const url = await this.saveFileImage(file, 'info-marker');
    const existing = await this.getSettings();

    if (existing) {
      existing.infoMarkerIconUrl = url;
      return this.repo.save(existing);
    }

    return this.repo.save({ infoMarkerIconUrl: url } as CompanySettings);
  }

  async uploadTouristMarkerIcon(file: Multer.File): Promise<CompanySettings> {
    const url = await this.saveFileImage(file, 'tourist-marker');
    const existing = await this.getSettings();

    if (existing) {
      existing.touristMarkerIconUrl = url;
      return this.repo.save(existing);
    }

    return this.repo.save({ touristMarkerIconUrl: url } as CompanySettings);
  }

  private async prepareSettingsPayload(
    dto: CreateCompanySettingsDto | UpdateCompanySettingsDto,
  ): Promise<Partial<CompanySettings>> {
    const payload: Partial<CompanySettings> = {
      phone: dto.phone,
      phoneIsWhatsApp: dto.phoneIsWhatsApp,
      email: dto.email,
      backgroundColor: dto.backgroundColor,
      headerColor: dto.headerColor,
      buttonColor: dto.buttonColor,
      logoUrl: dto.logoUrl,
      infoMarkerIconUrl: dto.infoMarkerIconUrl,
      touristMarkerIconUrl: dto.touristMarkerIconUrl,
    };

    const uploadDir = join(
      __dirname,
      '..',
      '..',
      'public',
      'uploads',
      'company-settings',
    );
    await fs.mkdir(uploadDir, { recursive: true });

    if (dto.logoBase64) {
      payload.logoUrl = await this.saveBase64Image(
        dto.logoBase64,
        'logo',
        uploadDir,
      );
    }

    if (dto.infoMarkerIconBase64) {
      payload.infoMarkerIconUrl = await this.saveBase64Image(
        dto.infoMarkerIconBase64,
        'info-marker',
        uploadDir,
      );
    }

    if (dto.touristMarkerIconBase64) {
      payload.touristMarkerIconUrl = await this.saveBase64Image(
        dto.touristMarkerIconBase64,
        'tourist-marker',
        uploadDir,
      );
    }

    return payload;
  }

  private async saveBase64Image(
    base64: string,
    prefix: string,
    uploadDir: string,
  ): Promise<string> {
    const matches = base64.match(
      /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/,
    );
    if (!matches) {
      throw new BadRequestException(
        'Imagen base64 inválida, formato esperado data:image/<type>;base64,...',
      );
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const filePath = join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    return `${this.getBaseUrl()}/public/uploads/company-settings/${filename}`;
  }
}
