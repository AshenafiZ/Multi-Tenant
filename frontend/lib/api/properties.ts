import apiClient from '../api-client';
import type { Property, PaginatedResponse, FilterPropertiesParams } from '../types';

export interface CreatePropertyDto {
  title: string;
  description: string;
  location: string;
  price: number;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
}

export const propertiesApi = {
  getProperties: async (params?: FilterPropertiesParams): Promise<PaginatedResponse<Property>> => {
    const response = await apiClient.get<PaginatedResponse<Property>>('/properties', { params });
    return response.data;
  },

  getProperty: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (data: CreatePropertyDto): Promise<Property> => {
    const response = await apiClient.post<Property>('/properties', data);
    return response.data;
  },

  updateProperty: async (id: string, data: UpdatePropertyDto): Promise<Property> => {
    const response = await apiClient.patch<Property>(`/properties/${id}`, data);
    return response.data;
  },

  publishProperty: async (id: string): Promise<Property> => {
    const response = await apiClient.post<Property>(`/properties/${id}/publish`);
    return response.data;
  },

  disableProperty: async (id: string): Promise<Property> => {
    const response = await apiClient.post<Property>(`/properties/${id}/disable`);
    return response.data;
  },

  deleteProperty: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },
};

