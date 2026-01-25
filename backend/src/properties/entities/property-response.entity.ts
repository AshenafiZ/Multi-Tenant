import { ApiProperty } from '@nestjs/swagger';

export class OwnerInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class ImageInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;
}

export class PropertyResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: ['draft', 'published', 'archived'] })
  status: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ type: OwnerInfo })
  owner: OwnerInfo;

  @ApiProperty({ type: [ImageInfo] })
  images: ImageInfo[];

  @ApiProperty()
  favoritesCount: number;

  @ApiProperty()
  messagesCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt?: Date | null;
}
