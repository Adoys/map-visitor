import { PartialType } from '@nestjs/mapped-types';
import { CreateSmtpDto } from './create-smtp.dto';

// eslint-disable-next-line prettier/prettier
export class UpdateSmtpDto extends PartialType(CreateSmtpDto) { }
