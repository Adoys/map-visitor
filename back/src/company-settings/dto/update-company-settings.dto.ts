/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanySettingsDto } from './create-company-settings.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateCompanySettingsDto extends PartialType(
  CreateCompanySettingsDto,
) { }
