import apiServer from '../api-server';
import type { Property, PaginatedResponse, FilterPropertiesParams } from '../types';

export const propertiesApiServer = {
  getProperties: async (params?: FilterPropertiesParams): Promise<PaginatedResponse<Property>> => {
    try {
      const response = await apiServer.get<PaginatedResponse<Property>>('/properties', { params });
      return response.data;
    } catch (error: any) {
      console.error('Server-side properties API error:', error);
      console.error('Request params:', params);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },

  getProperty: async (id: string): Promise<Property> => {
    try {
      const response = await apiServer.get<Property>(`/properties/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Server-side property API error:', error);
      throw error;
    }
  },
};

