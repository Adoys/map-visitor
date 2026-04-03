import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  Delete,
  Param,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CompanyLanguagesService } from './company-languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller('company-languages')
export class CompanyLanguagesController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly service: CompanyLanguagesService) { }

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateLanguageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: number, @Body() dto: UpdateLanguageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
