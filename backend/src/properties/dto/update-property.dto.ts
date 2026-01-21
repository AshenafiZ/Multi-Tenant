import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
  IsEnum 
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '../../generated/prisma/client';

export class UpdatePropertyDto {
  @ApiPropertyOptional({ example: 'Updated Modern 3BR Apartment' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated luxury apartment...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa, Bole Updated' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 275000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: PropertyStatus, example: 'published' })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
