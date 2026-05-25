import { Type } from 'class-transformer';
import { IsArray, IsString, MaxLength, ValidateNested } from 'class-validator';

export class AppTranslationPhraseDto {
  @IsString()
  @MaxLength(160)
  key: string;

  @IsString()
  value: string;
}

export class UpsertAppTranslationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppTranslationPhraseDto)
  phrases: AppTranslationPhraseDto[];
}
