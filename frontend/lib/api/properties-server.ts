import apiServer from '../api-server';
import type { Property, PaginatedResponse, FilterPropertiesParams } from '../types';

export const propertiesApiServer = {
  getProperties: async (params?: FilterPropertiesParams): Promise<PaginatedResponse<Property>> => {
    const response = await apiServer.get<PaginatedResponse<Property>>('/properties', { params });
    return response.data;
  },

  getProperty: async (id: string): Promise<Property> => {
    const response = await apiServer.get<Property>(`/properties/${id}`);
    return response.data;
  },
};

