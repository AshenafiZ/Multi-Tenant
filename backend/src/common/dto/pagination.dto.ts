import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  pages: number;
}

export interface PaginatedResponse<T> {
  messages: T[];
  pagination: PaginationMeta;
}

export class PaginatedMessagesResponse {
  @ApiProperty({ type: 'array' })
  messages: any[];

  @ApiProperty({ type: PaginationMeta })
  pagination: PaginationMeta;
}
