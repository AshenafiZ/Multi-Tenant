import apiClient from '../api-client';
import type { AuthResponse, User } from '../types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'owner';
}

export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  bootstrap: async (data: { email: string; password: string; firstName: string; lastName: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/bootstrap', data);
    return response.data;
  },
};

