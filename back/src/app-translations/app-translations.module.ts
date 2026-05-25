import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AppTranslationPhrase } from './app-translation-phrase.entity';
import { AppTranslationsController } from './app-translations.controller';
import { AppTranslationsService } from './app-translations.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([AppTranslationPhrase])],
  controllers: [AppTranslationsController],
  providers: [AppTranslationsService],
  exports: [AppTranslationsService],
})
export class AppTranslationsModule { }
