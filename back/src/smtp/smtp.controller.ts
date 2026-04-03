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
import { CreateSmtpDto } from './dto/create-smtp.dto';
import { UpdateSmtpDto } from './dto/update-smtp.dto';
import { SmtpService } from './smtp.service';
import { TestSmtpDto } from './dto/test-smtp.dto';

@Controller('smtp')
export class SmtpController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly service: SmtpService) { }

  @Get()
  getSmtp() {
    return this.service.getSmtp();
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateSmtpDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: number, @Body() dto: UpdateSmtpDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: number) {
    return this.service.delete(id);
  }

  @Post('test')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  test(@Body() dto: TestSmtpDto) {
    return this.service.test(dto);
  }
}
