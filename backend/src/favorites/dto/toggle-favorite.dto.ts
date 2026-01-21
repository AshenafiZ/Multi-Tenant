import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {
  @ApiProperty({ example: 'prop_123', description: 'Property ID' })
  @IsUUID()
  propertyId: string;
}
