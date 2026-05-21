import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, Multer } from 'multer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Controller('company-settings')
export class CompanySettingsController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly service: CompanySettingsService) { }

  @Get()
  get() {
    return this.service.getSettings();
  }

  @Patch()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Body() dto: UpdateCompanySettingsDto) {
    return this.service.update(dto);
  }

  @Patch('logo')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  uploadLogo(@UploadedFile() file: Multer.File) {
    return this.service.uploadLogo(file);
  }

  @Patch('map-image')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('mapImage', { storage: memoryStorage() }))
  uploadMapImage(@UploadedFile() file: Multer.File) {
    return this.service.uploadMapImage(file);
  }

  @Patch('info-marker-icon')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('infoMarkerIcon', { storage: memoryStorage() }),
  )
  uploadInfoMarkerIcon(@UploadedFile() file: Multer.File) {
    return this.service.uploadInfoMarkerIcon(file);
  }

  @Patch('tourist-marker-icon')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('touristMarkerIcon', { storage: memoryStorage() }))
  uploadTouristMarkerIcon(@UploadedFile() file: Multer.File) {
    return this.service.uploadTouristMarkerIcon(file);
  }
}
