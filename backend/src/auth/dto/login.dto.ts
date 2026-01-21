import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @ApiProperty({ example: 'John123Secure!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
