import apiClient from '../api-client';
import type { Image } from '../types';

export interface UploadImagesResponse {
  images: Image[];
}

export const imagesApi = {
  upload: async (propertyId: string, files: File[]): Promise<UploadImagesResponse> => {
    const formData = new FormData();
    formData.append('propertyId', propertyId);
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post<UploadImagesResponse>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/images/${id}`);
  },
};

