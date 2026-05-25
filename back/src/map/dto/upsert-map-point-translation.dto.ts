import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertMapPointTranslationDto {
  @IsString()
  @MaxLength(10)
  languageCode: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  descriptionHtml?: string | null;
}
