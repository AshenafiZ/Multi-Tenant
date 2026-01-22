'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { favoritesApi } from './api/favorites';
import toast from 'react-hot-toast';

interface FavoritesState {
  favoriteIds: Set<string>;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
  syncFavorites: () => Promise<void>;
}

export const useFavoriteStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: new Set<string>(),
      
      isFavorite: (propertyId: string) => {
        return get().favoriteIds.has(propertyId);
      },

      toggleFavorite: async (propertyId: string) => {
        const current = get().favoriteIds;
        const isCurrentlyFavorite = current.has(propertyId);
        
        // Optimistic update
        const newSet = new Set(current);
        if (isCurrentlyFavorite) {
          newSet.delete(propertyId);
        } else {
          newSet.add(propertyId);
        }
        set({ favoriteIds: newSet });

        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('favorites-updated', Date.now().toString());
        }

        try {
          if (isCurrentlyFavorite) {
            await favoritesApi.removeFavorite(propertyId);
            toast.success('Removed from favorites');
          } else {
            await favoritesApi.addFavorite(propertyId);
            toast.success('Added to favorites');
          }
        } catch (error: any) {
          // Revert on error
          set({ favoriteIds: current });
          toast.error(error.response?.data?.message || 'Failed to update favorites');
        }
      },

      syncFavorites: async () => {
        try {
          // Only sync if user is authenticated (check token)
          if (typeof window !== 'undefined') {
            const token = document.cookie.match(/accessToken=([^;]+)/)?.[1];
            if (!token) {
              set({ favoriteIds: new Set() });
              return;
            }
            const response = await favoritesApi.getFavorites();
            const ids = new Set(response.data.map((fav) => fav.propertyId));
            set({ favoriteIds: ids });
          }
        } catch (error) {
          console.error('Failed to sync favorites:', error);
          // On error, clear favorites
          set({ favoriteIds: new Set() });
        }
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);

// Listen for cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'favorites-updated') {
      const store = useFavoriteStore.getState();
      store.syncFavorites();
    }
  });
}

