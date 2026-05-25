import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

enum MapPointType {
  Interest = 'interest',
  Info = 'info',
}

export class CreateMapPointDto {
  @IsString()
  label: string;

  @IsString()
  description: string;

  @IsEnum(MapPointType)
  type: 'interest' | 'info';

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsOptional()
  @IsNumber()
  userId?: number;
}
