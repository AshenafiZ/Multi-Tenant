import apiClient from '../api-client';
import type { User, PaginatedResponse } from '../types';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
  role?: 'admin' | 'owner' | 'user';
  isActive?: boolean;
  search?: string;
}

export const usersApi = {
  getAll: async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
    const queryParams: any = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.includeDeleted !== undefined) {
      queryParams.includeDeleted = params.includeDeleted;
    }
    if (params?.role) queryParams.role = params.role;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
    if (params?.search) queryParams.search = params.search;
    
    try {
      const response = await apiClient.get<PaginatedResponse<User>>('/users', { params: queryParams });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      console.error('Request params:', queryParams);
      console.error('Response:', error.response?.data);
      throw error;
    }
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

