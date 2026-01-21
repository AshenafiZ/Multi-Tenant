import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'owner' | 'user';
    isActive: boolean;
  };
}

export class UserInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: ['admin', 'owner', 'user'] })
  role: 'admin' | 'owner' | 'user';

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
