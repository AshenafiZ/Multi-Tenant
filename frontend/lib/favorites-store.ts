'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { favoritesApi } from './api/favorites';
import toast from 'react-hot-toast';

interface FavoritesState {
  favoriteIds: Set<string>;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
  syncFavorites: () => Promise<void>;
}

// Custom storage that handles Set serialization
const createSetStorage = () => {
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        // Parse, convert Set to array, then stringify again
        const parsed = JSON.parse(value);
        if (parsed.state?.favoriteIds instanceof Set) {
          parsed.state.favoriteIds = Array.from(parsed.state.favoriteIds);
        }
        localStorage.setItem(name, JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to save favorites:', error);
        // Fallback: save as-is
        localStorage.setItem(name, value);
      }
    },
    removeItem: (name: string): void => {
      localStorage.removeItem(name);
    },
  };
};

export const useFavoriteStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: new Set<string>(),

      isFavorite: (propertyId: string) => {
        const favoriteIds = get().favoriteIds;

        if (favoriteIds instanceof Set) {
          return favoriteIds.has(propertyId);
        }

        if (Array.isArray(favoriteIds)) {
          const validIds: string[] = (favoriteIds as unknown[]).filter((id: unknown): id is string =>
            typeof id === 'string'
          );
          const newSet = new Set<string>(validIds);
          set({ favoriteIds: newSet });
          return newSet.has(propertyId);
        }

        if (favoriteIds && typeof favoriteIds === 'object') {
          const values = Object.values(favoriteIds) as unknown[];
          const validIds: string[] = values.filter((id: unknown): id is string =>
            typeof id === 'string'
          );
          const newSet = new Set<string>(validIds);
          set({ favoriteIds: newSet });
          return newSet.has(propertyId);
        }
        return false;
      },

      toggleFavorite: async (propertyId: string) => {
        let current = get().favoriteIds;
        // Ensure current is a Set
        if (!(current instanceof Set)) {
          if (Array.isArray(current)) {
            current = new Set(current);
          } else if (current && typeof current === 'object') {
            current = new Set(Object.values(current));
          } else {
            current = new Set();
          }
          set({ favoriteIds: current });
        }

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
          const errorMessage = error.response?.data?.message || 'Failed to update favorites';
          // Check if error is about already being favorited
          if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('duplicate')) {
            toast.error('This property is already in your favorites');
          } else {
            toast.error(errorMessage);
          }
        }
      },

      syncFavorites: async () => {
        try {
          // Only sync if user is authenticated (check token)
          if (typeof window === 'undefined') {
            return;
          }

          const token = document.cookie.match(/accessToken=([^;]+)/)?.[1];
          if (!token) {
            set({ favoriteIds: new Set() });
            return;
          }

          const response = await favoritesApi.getFavorites();

          // Handle both array response and paginated response
          let favoritesArray: any[] = [];

          if (Array.isArray(response)) {
            // Backend returns array directly
            favoritesArray = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            // Backend returns paginated response
            favoritesArray = response.data;
          } else {
            // Unexpected structure, clear favorites
            console.warn('Unexpected favorites response structure:', response);
            set({ favoriteIds: new Set() });
            return;
          }

          // Extract property IDs from favorites
          const ids = new Set(
            favoritesArray
              .map((fav) => fav.propertyId || fav.property?.id)
              .filter((id) => id != null)
          );

          // Only update state if window is still available (component not unmounted)
          if (typeof window !== 'undefined') {
            set({ favoriteIds: ids });
          }
        } catch (error) {
          console.error('Failed to sync favorites:', error);
          // On error, only clear favorites if window is still available
          if (typeof window !== 'undefined') {
            set({ favoriteIds: new Set() });
          }
        }
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => createSetStorage()),
      // Convert array back to Set on rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.favoriteIds) {
          if (Array.isArray(state.favoriteIds)) {
            state.favoriteIds = new Set(state.favoriteIds);
          } else if (state.favoriteIds && typeof state.favoriteIds === 'object' && !(state.favoriteIds instanceof Set)) {
            // Handle case where it's an object (from old storage format)
            state.favoriteIds = new Set(Object.values(state.favoriteIds));
          }
        }
      },
    }
  )
);

// Listen for cross-tab sync with proper cleanup
if (typeof window !== 'undefined') {
  let isMounted = true;

  const handleStorageChange = (e: StorageEvent) => {
    if (!isMounted) return;

    if (e.key === 'favorites-updated') {
      try {
        const store = useFavoriteStore.getState();
        if (store && typeof store.syncFavorites === 'function') {
          store.syncFavorites();
        }
      } catch (error) {
        console.error('Error syncing favorites from storage event:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Cleanup function for hot module reloading
  if (typeof window !== 'undefined' && (window as any).__FAVORITES_CLEANUP) {
    (window as any).__FAVORITES_CLEANUP();
  }

  (window as any).__FAVORITES_CLEANUP = () => {
    isMounted = false;
    window.removeEventListener('storage', handleStorageChange);
    delete (window as any).__FAVORITES_CLEANUP;
  };
}

