import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyLanguagesService } from './company-languages.service';
import { CompanyLanguagesController } from './company-languages.controller';
import { CompanyLanguage } from 'src/company-languages/entities/company-language.entity';
import { CompanySettings } from 'src/company-settings/entities/company-settings.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([CompanyLanguage, CompanySettings]),
  ],
  controllers: [CompanyLanguagesController],
  providers: [CompanyLanguagesService],
  exports: [CompanyLanguagesService],
})
// eslint-disable-next-line prettier/prettier
export class CompanyLanguagesModule { }
