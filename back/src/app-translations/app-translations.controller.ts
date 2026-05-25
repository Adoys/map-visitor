import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppTranslationsService } from './app-translations.service';
import { UpsertAppTranslationsDto } from './dto/upsert-app-translations.dto';

@Controller('app-translations')
export class AppTranslationsController {
  constructor(private readonly service: AppTranslationsService) { }

  @Get(':languageCode')
  findByLanguage(@Param('languageCode') languageCode: string) {
    return this.service.findByLanguage(languageCode);
  }

  @Put(':languageCode')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  upsertLanguage(
    @Param('languageCode') languageCode: string,
    @Body() dto: UpsertAppTranslationsDto,
  ) {
    return this.service.upsertLanguage(languageCode, dto);
  }
}
