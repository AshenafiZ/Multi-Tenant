import { IsString, IsNumber, Min, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyStatus } from '../../generated/prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Modern 3BR Apartment Downtown' })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({ example: 'Luxury apartment with pool access...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Addis Ababa, Bole' })
  @IsString()
  @Length(3, 255)
  location: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: PropertyStatus, example: 'draft' })
  @IsEnum(PropertyStatus)
  status: PropertyStatus = 'draft';
}
