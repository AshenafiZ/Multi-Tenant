import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/client';

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
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @Type(() => Number)
  @Transform(({ value }) => Math.max(1, value))
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 10 })
  @Type(() => Number)
  @Transform(({ value }) => Math.min(100, Math.max(1, value)))
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  search?: string;
}
