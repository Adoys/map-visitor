import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateMapPointImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
