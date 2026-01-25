import axios, { AxiosError, AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Don't add auth token for login/register/auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                           config.url?.includes('/auth/register') ||
                           config.url?.includes('/auth/bootstrap');
    
    if (!isAuthEndpoint) {
      const token = Cookies.get('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
let isRedirecting = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login/register pages or if it's an auth request
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register') ||
                           error.config?.url?.includes('/auth/bootstrap') ||
                           error.config?.url?.includes('/auth/current-user');
      
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }
      
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login' || currentPath === '/register';
      
      // Only redirect if it's NOT an auth request, NOT already on login page, and NOT already redirecting
      if (!isAuthRequest && !isLoginPage && !isRedirecting) {
        isRedirecting = true;
        // Clear tokens on 401
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        // Use replace instead of href to prevent adding to history
        window.location.replace('/login');
        // Reset flag after a delay to allow for navigation
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

