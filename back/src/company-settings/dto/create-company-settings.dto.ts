import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateCompanySettingsDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  phoneIsWhatsApp?: boolean;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  headerColor?: string;

  @IsOptional()
  @IsString()
  buttonColor?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoBase64?: string;

  @IsOptional()
  @IsString()
  mapImageUrl?: string;

  @IsOptional()
  @IsString()
  mapImageBase64?: string;

  @IsOptional()
  @IsString()
  infoMarkerIconUrl?: string;

  @IsOptional()
  @IsString()
  infoMarkerIconBase64?: string;

  @IsOptional()
  @IsString()
  touristMarkerIconUrl?: string;

  @IsOptional()
  @IsString()
  touristMarkerIconBase64?: string;
}
