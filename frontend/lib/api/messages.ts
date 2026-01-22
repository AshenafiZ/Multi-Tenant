import apiClient from '../api-client';
import type { Message, PaginatedResponse } from '../types';

export interface CreateMessageDto {
  receiverId: string;
  propertyId: string;
  content: string;
}

export const messagesApi = {
  sendMessage: async (data: CreateMessageDto): Promise<Message> => {
    const response = await apiClient.post<Message>('/messages', data);
    return response.data;
  },

  getInbox: async (): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get<PaginatedResponse<Message>>('/messages/inbox');
    return response.data;
  },

  getSent: async (): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get<PaginatedResponse<Message>>('/messages/sent');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/messages/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch('/messages/read', { id });
  },

  deleteMessage: async (id: string): Promise<void> => {
    await apiClient.delete(`/messages/${id}`);
  },
};

