export type Role = 'admin' | 'owner' | 'user';
export type PropertyStatus = 'draft' | 'published' | 'archived';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  status: PropertyStatus;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  images: Image[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Image {
  id: string;
  url: string;
  publicId: string;
  propertyId: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  property: Property;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId: string;
  content: string;
  isRead: boolean;
  sender: User;
  receiver: User;
  property: Property;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterPropertiesParams {
  status?: PropertyStatus;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  page?: number;
  limit?: number;
}

