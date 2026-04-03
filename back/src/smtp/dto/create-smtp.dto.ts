import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSmtpDto {
  @IsInt()
  @IsOptional()
  id: number;

  @IsString()
  host: string;

  @IsInt()
  @Min(1)
  port: number;

  @IsString()
  security: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEmail()
  email: string;
}
