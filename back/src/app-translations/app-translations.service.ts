import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppTranslationPhrase } from './app-translation-phrase.entity';
import { UpsertAppTranslationsDto } from './dto/upsert-app-translations.dto';

@Injectable()
export class AppTranslationsService {
  constructor(
    @InjectRepository(AppTranslationPhrase)
    private readonly repo: Repository<AppTranslationPhrase>,
  ) { }

  async findByLanguage(languageCode: string): Promise<Record<string, string>> {
    const phrases = await this.repo.find({
      where: { languageCode },
      order: { translationKey: 'ASC' },
    });

    return phrases.reduce<Record<string, string>>((acc, phrase) => {
      acc[phrase.translationKey] = phrase.value;
      return acc;
    }, {});
  }

  async upsertLanguage(languageCode: string, dto: UpsertAppTranslationsDto) {
    const saved: AppTranslationPhrase[] = [];

    for (const phrase of dto.phrases) {
      const existing = await this.repo.findOne({
        where: { languageCode, translationKey: phrase.key },
      });

      if (existing) {
        existing.value = phrase.value;
        saved.push(await this.repo.save(existing));
        continue;
      }

      saved.push(
        await this.repo.save(
          this.repo.create({
            languageCode,
            translationKey: phrase.key,
            value: phrase.value,
          }),
        ),
      );
    }

    return saved;
  }
}
