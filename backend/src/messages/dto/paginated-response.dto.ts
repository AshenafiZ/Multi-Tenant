import { ApiProperty } from '@nestjs/swagger';

// ────────────────────────────────────────────────
// Reusable pagination metadata
// ────────────────────────────────────────────────
export class PaginationMeta {
  @ApiProperty({ example: 1, description: 'Current page number (1-based)' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 142, description: 'Total number of matching messages' })
  total: number;

  @ApiProperty({ example: 8, description: 'Total number of pages' })
  pages: number;
}

// ────────────────────────────────────────────────
// Common base properties for every message in the list
// ────────────────────────────────────────────────
class BaseMessageDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Hey, is the apartment still available?' })
  content: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2025-12-15T14:30:00.000Z' })
  createdAt: Date | string; // Date works, but string ISO is common in JSON

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'prop-uuid-123' },
      title: { type: 'string', example: 'Cozy 2BR Apartment in Bole' },
      price: { type: 'number', example: 25000 },
      images: {
        type: 'array',
        items: { type: 'string', example: 'https://example.com/img1.jpg' },
      },
    },
  })
  property: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

// ────────────────────────────────────────────────
// Inbox-specific message (shows sender)
// ────────────────────────────────────────────────
export class InboxMessageDto extends BaseMessageDto {
  @ApiProperty({ example: 'Abebe' })
  senderFirstName: string;

  @ApiProperty({ example: 'Kebede', nullable: true })
  senderLastName: string | null;
}

// ────────────────────────────────────────────────
// Sent-specific message (shows receiver)
// ────────────────────────────────────────────────
export class SentMessageDto extends BaseMessageDto {
  @ApiProperty({ example: 'Meron' })
  receiverFirstName: string;

  @ApiProperty({ example: 'Alemu', nullable: true })
  receiverLastName: string | null;
}

// ────────────────────────────────────────────────
// Final paginated response (used in @ApiOkResponse)
// ────────────────────────────────────────────────
export class PaginatedMessagesResponse {
  @ApiProperty({
    description: 'Array of messages (inbox shows sender info, sent shows receiver info)',
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/InboxMessageDto' },
        { $ref: '#/components/schemas/SentMessageDto' },
      ],
    },
  })
  messages: (InboxMessageDto | SentMessageDto)[];

  @ApiProperty({ type: () => PaginationMeta })
  pagination: PaginationMeta;
}