import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(Role)
  role: Role = 'admin';
}
