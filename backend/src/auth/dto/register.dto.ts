import { IsEmail, IsString, MinLength, IsIn, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'abebe.kebede@example.com', description: 'Unique email address' })
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @ApiProperty({ example: 'Abebe123Secure!', minLength: 8, description: 'Password (min 8 chars)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: 'Abebe', description: 'First name (max 100 chars)' })
  @IsString()
  @Length(1, 100, { message: 'First name must be 1-100 characters' })
  firstName: string;

  @ApiProperty({ example: 'Kebede', description: 'Last name (max 100 chars)' })
  @IsString()
  @Length(1, 100, { message: 'Last name must be 1-100 characters' })
  lastName: string;

  @ApiProperty({ 
    enum: ['user', 'owner'], 
    example: 'owner',
    description: 'Role: user (tenant) or owner (property owner)' 
  })
  @IsIn(['user', 'owner'], { message: 'Role must be "user" or "owner"' })
  role: 'user' | 'owner';
}
