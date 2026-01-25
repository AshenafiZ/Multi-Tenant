import { IsEmail, IsString, IsEnum, MinLength, Length } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ example: 'abebe.kebede@example.com' })
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'Abebe' })
  @IsString()
  @Length(1, 100, { message: 'First name must be 1-100 characters' })
  firstName: string;

  @ApiProperty({ example: 'Kebede' })
  @IsString()
  @Length(1, 100, { message: 'Last name must be 1-100 characters' })
  lastName: string;

  @ApiProperty({ 
    enum: ['admin', 'owner', 'user'],
    enumName: 'Role',
    example: 'user',
    description: 'Admin can create any role: admin, owner, or user'
  })
  @IsEnum(Role, { message: 'Role must be admin, owner, or user' })
  role: Role;
}
