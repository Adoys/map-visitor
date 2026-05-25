import { IsNumber } from 'class-validator';

export class UpdateMapPointPositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}
