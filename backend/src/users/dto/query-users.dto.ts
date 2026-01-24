import { IsOptional, IsEnum, IsBoolean, IsString, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class QueryUsersDto {
  @ApiPropertyOptional({ example: 'user' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Return only current user' })
  @IsOptional()
  @IsBoolean()
  me?: boolean;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => Math.max(1, value || 1))
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => Math.min(100, Math.max(1, value || 10)))
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 0, description: 'Minimum properties owned' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minProperties?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum properties owned' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxProperties?: number;

  @ApiPropertyOptional({ example: 0, description: 'Minimum favorites' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minFavorites?: number;

  @ApiPropertyOptional({ example: 50, description: 'Maximum favorites' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxFavorites?: number;
}
