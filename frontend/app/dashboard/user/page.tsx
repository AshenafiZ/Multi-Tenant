'use client';

import ProtectedRoute from '@/components/protected-route';
import { useQuery } from '@tanstack/react-query';
import { favoritesApi } from '@/lib/api/favorites';
import { messagesApi } from '@/lib/api/messages';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageSquare, MapPin, DollarSign } from 'lucide-react';
import { useFavoriteStore } from '@/lib/favorites-store';
import { useEffect } from 'react';

export default function UserDashboard() {
  const { syncFavorites } = useFavoriteStore();

  useEffect(() => {
    syncFavorites();
  }, [syncFavorites]);

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getFavorites(),
  });

  const { data: inbox, isLoading: inboxLoading } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: () => messagesApi.getInbox(),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => messagesApi.getUnreadCount(),
  });

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Favorites</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {favorites?.data.length || 0}
                </p>
              </div>
              <Heart className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {inbox?.data.length || 0}
                </p>
              </div>
              <MessageSquare className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Unread</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {unreadCount?.count || 0}
                </p>
              </div>
              <MessageSquare className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Favorites Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              My Favorites
            </h2>
            {favoritesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : favorites?.data.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No favorites yet</p>
            ) : (
              <div className="space-y-4">
                {favorites?.data.map((favorite) => (
                  <Link
                    key={favorite.id}
                    href={`/properties/${favorite.property.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex space-x-4">
                      {favorite.property.images?.[0] && (
                        <div className="relative w-24 h-24 shrink-0">
                          <Image
                            src={favorite.property.images[0].url}
                            alt={favorite.property.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{favorite.property.title}</h3>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{favorite.property.location}</span>
                        </div>
                        <div className="flex items-center text-blue-600 font-semibold mt-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{parseFloat(favorite.property.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Messages Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
              Messages
            </h2>
            {inboxLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : inbox?.data.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No messages yet</p>
            ) : (
              <div className="space-y-4">
                {inbox?.data.map((message) => (
                  <div
                    key={message.id}
                    className={`border rounded-lg p-4 ${!message.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          From: {message.sender.firstName} {message.sender.lastName}
                        </p>
                        <p className="text-sm text-gray-600">Re: {message.property.title}</p>
                      </div>
                      {!message.isRead && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

