import { PartialType } from '@nestjs/mapped-types';
import { CreateLanguageDto } from './create-language.dto';

// eslint-disable-next-line prettier/prettier
export class UpdateLanguageDto extends PartialType(CreateLanguageDto) { }
