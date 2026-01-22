'use client';

import { Property } from '@/lib/types';
import { useAuthStore } from '@/lib/auth-store';
import { useFavoriteStore } from '@/lib/favorites-store';
import { messagesApi } from '@/lib/api/messages';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Heart, MessageSquare, Send } from 'lucide-react';

interface PropertyDetailClientProps {
  property: Property;
}

interface MessageFormData {
  content: string;
}

export default function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormData>();

  const favorite = isFavorite(property.id);
  const canContact = isAuthenticated && user?.role === 'user' && property.ownerId && property.status === 'published';
  const isOwner = user?.id === property.ownerId;
  const isAdmin = user?.role === 'admin';
  
  // Show property if: published, or user is owner/admin
  const canView = property.status === 'published' || isOwner || isAdmin;
  
  if (!canView) {
    return (
      <div className="border-t pt-6 mt-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            This property is not published yet. Only the owner can view draft properties.
          </p>
        </div>
      </div>
    );
  }

  const onSubmitMessage = async (data: MessageFormData) => {
    if (!property.ownerId) return;
    
    setIsSending(true);
    try {
      await messagesApi.sendMessage({
        receiverId: property.ownerId,
        propertyId: property.id,
        content: data.content,
      });
      toast.success('Message sent successfully!');
      reset();
      setShowMessageForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex items-center space-x-4">
        {isAuthenticated && !isOwner && (
          <>
            <button
              onClick={() => toggleFavorite(property.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                favorite
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
              <span>{favorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
            </button>

            {canContact && (
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Contact Owner</span>
              </button>
            )}
          </>
        )}

        {!isAuthenticated && (
          <p className="text-gray-600 text-sm">
            <a href="/login" className="text-blue-600 hover:underline">Sign in</a> to save favorites or contact the owner
          </p>
        )}
      </div>

      {showMessageForm && canContact && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Send a message to the owner</h3>
          <form onSubmit={handleSubmit(onSubmitMessage)} className="space-y-3">
            <textarea
              {...register('content', { required: 'Message is required', minLength: 10 })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Write your message here..."
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowMessageForm(false);
                  reset();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

