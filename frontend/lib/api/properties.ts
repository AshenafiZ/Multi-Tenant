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

  getMyProperties: async (params?: FilterPropertiesParams): Promise<PaginatedResponse<Property>> => {
    const response = await apiClient.get<PaginatedResponse<Property>>('/properties/my-properties', { params });
    return response.data;
  },

  getProperty: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (data: CreatePropertyDto, images?: File[]): Promise<Property> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('price', data.price.toString());
    
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await apiClient.post<Property>('/properties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProperty: async (id: string, data: UpdatePropertyDto, images?: File[]): Promise<Property> => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.location) formData.append('location', data.location);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await apiClient.patch<Property>(`/properties/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

