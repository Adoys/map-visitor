import { IsEmail } from 'class-validator';
import { CreateSmtpDto } from './create-smtp.dto';

export class TestSmtpDto extends CreateSmtpDto {
  @IsEmail()
  testEmail: string;
}
