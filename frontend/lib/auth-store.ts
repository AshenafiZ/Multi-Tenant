import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        // Also sync with cookies for SSR
        if (user) {
          // User data is already in zustand persist, but we keep token in cookies
        } else {
          if (typeof window !== 'undefined') {
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
          }
        }
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

