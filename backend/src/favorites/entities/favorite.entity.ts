import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;
}
