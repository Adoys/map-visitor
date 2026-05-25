import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, Multer } from 'multer';
import { MapPointsService } from './map.service';
import { CreateMapPointDto } from './dto/create-map-point.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpsertMapPointTranslationDto } from './dto/upsert-map-point-translation.dto';
import { UpdateMapPointPositionDto } from './dto/update-map-point-position.dto';
import { UpdateMapPointImageDto } from './dto/update-map-point-image.dto';

@Controller('map-points')
export class MapController {
  constructor(private readonly mapPointsService: MapPointsService) { }

  @Get()
  async findAll() {
    return this.mapPointsService.findAll();
  }

  @Get(':id/content')
  async getContent(@Param('id') id: number, @Query('language') language?: string) {
    return this.mapPointsService.getContent(Number(id), language);
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createMapPointDto: CreateMapPointDto) {
    return this.mapPointsService.create(createMapPointDto);
  }

  @Patch(':id/position')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePosition(
    @Param('id') id: number,
    @Body() dto: UpdateMapPointPositionDto,
  ) {
    return this.mapPointsService.updatePosition(Number(id), dto);
  }

  @Patch(':id/translations')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async upsertTranslation(
    @Param('id') id: number,
    @Body() dto: UpsertMapPointTranslationDto,
  ) {
    return this.mapPointsService.upsertTranslation(Number(id), dto);
  }

  @Post(':id/images')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async uploadImage(@Param('id') id: number, @UploadedFile() file: Multer.File) {
    return this.mapPointsService.uploadImage(Number(id), file);
  }

  @Patch('images/:imageId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateImage(
    @Param('imageId') imageId: number,
    @Body() dto: UpdateMapPointImageDto,
  ) {
    return this.mapPointsService.updateImage(Number(imageId), dto);
  }

  @Delete('images/:imageId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteImage(@Param('imageId') imageId: number) {
    return this.mapPointsService.deleteImage(Number(imageId));
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: number) {
    return this.mapPointsService.delete(id);
  }
}
