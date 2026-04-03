import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettingsController } from './company-settings.controller';
import { CompanyLanguage } from '../company-languages/entities/company-language.entity';
import { CompanySettings } from './entities/company-settings.entity';
import { NotificationsModule } from '../notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanySettings, CompanyLanguage]),
    NotificationsModule,
  ],
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService],
  exports: [CompanySettingsService],
})
// eslint-disable-next-line prettier/prettier
export class CompanySettingsModule { }
