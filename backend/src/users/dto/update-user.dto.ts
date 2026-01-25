import { IsOptional, IsEnum, IsBoolean, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ example: 'Abebe', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiProperty({ example: 'Kebede', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiProperty({ enum: ['admin', 'owner', 'user'], required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
