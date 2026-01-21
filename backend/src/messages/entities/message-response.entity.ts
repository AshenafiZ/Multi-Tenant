import { ApiProperty } from '@nestjs/swagger';

export class MessageResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  receiverId: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  senderFirstName: string;

  @ApiProperty()
  receiverFirstName: string;

  @ApiProperty()
  propertyTitle: string;

  @ApiProperty()
  createdAt: Date;
}
