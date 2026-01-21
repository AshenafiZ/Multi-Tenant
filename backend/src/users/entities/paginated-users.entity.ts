import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  pages: number;
}

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: ['admin', 'owner', 'user'] })
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt?: Date | null;

  @ApiProperty()
  propertiesCount: number;  

  @ApiProperty()
  favoritesCount: number;   
}

export class PaginatedUsersResponse {
  @ApiProperty({ type: [UserResponse] })
  data: UserResponse[];

  @ApiProperty({ type: PaginationMeta })
  pagination: PaginationMeta;
}
