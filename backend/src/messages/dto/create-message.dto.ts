import { IsUUID, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsUUID()
  receiverId: string;

  @ApiProperty({ example: 'property-uuid-456' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ example: 'Interested in viewing this property tomorrow?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class MarkAsReadDto {
  @ApiProperty({ example: ['msg-uuid-1', 'msg-uuid-2'] })
  @IsUUID('all', { each: true })
  messageIds: string[];
}
