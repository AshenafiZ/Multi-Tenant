import { IsString, IsNotEmpty, Min, Max, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImagesDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  files: any[];

  @ApiProperty({ example: 'property-uuid' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Min(1)
  @Max(10)
  primaryIndex?: number;
}
