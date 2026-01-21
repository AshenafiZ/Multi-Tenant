export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BaseMessageListItem {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;           
  property: {
    id: string;
    title: string;
    price: number;           
    images: string[];        
  };
}


export interface InboxMessageListItem extends BaseMessageListItem {
  senderFirstName: string;
  senderLastName: string | null;
  receiverFirstName?: never;   
  receiverLastName?: never;
}

export interface SentMessageListItem extends BaseMessageListItem {
  receiverFirstName: string;
  receiverLastName: string | null;
  senderFirstName?: never;
  senderLastName?: never;
}

export type MessageListItem = InboxMessageListItem | SentMessageListItem;

export interface PaginatedMessages {
  messages: MessageListItem[];
  pagination: PaginationMeta;
}