import { IsOptional, IsEnum, IsNumber, Min, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';

export class FilterPropertiesDto {
  @ApiPropertyOptional({ example: 'published', enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ example: 250000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 0, description: 'Minimum favorites' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minFavorites?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum messages' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxMessages?: number;

  @ApiPropertyOptional({ example: true, description: 'Return only current user properties' })
  @IsOptional()
  @IsBoolean()
  my?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Admin access (all statuses)' })
  @IsOptional()
  @IsBoolean()
  admin?: boolean;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Math.max(1, value || 1))
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Math.min(100, Math.max(1, value || 12)))
  limit?: number = 12;

  @ApiPropertyOptional({ example: false, description: 'Include soft-deleted properties (admin only)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean = false;
}
