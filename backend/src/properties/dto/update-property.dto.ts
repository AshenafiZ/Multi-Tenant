import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
}
