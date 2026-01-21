import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '../../generated/prisma/client';

export class FilterPropertiesDto {
  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ example: 250000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @Type(() => Number)
  @Transform(({ value }) => Math.max(1, value))
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 12 })
  @Type(() => Number)
  @Transform(({ value }) => Math.min(100, Math.max(1, value)))
  limit?: number = 12;
}
