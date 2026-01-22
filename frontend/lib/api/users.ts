import apiClient from '../api-client';
import type { User, PaginatedResponse } from '../types';

export const usersApi = {
  getAll: async (): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },
};

