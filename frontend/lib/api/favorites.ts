import apiClient from '../api-client';
import type { Favorite, PaginatedResponse } from '../types';

export const favoritesApi = {
  getFavorites: async (): Promise<Favorite[] | PaginatedResponse<Favorite>> => {
    const response = await apiClient.get<Favorite[] | PaginatedResponse<Favorite>>('/favorites');
    return response.data;
  },

  addFavorite: async (propertyId: string): Promise<Favorite> => {
    const response = await apiClient.post<Favorite>('/favorites', { propertyId });
    return response.data;
  },

  removeFavorite: async (propertyId: string): Promise<void> => {
    await apiClient.delete(`/favorites/${propertyId}`);
  },

  getFavoritesCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/favorites/count');
    return response.data;
  },
};

