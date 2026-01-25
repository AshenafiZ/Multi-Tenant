'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/protected-route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages';
import Link from 'next/link';
import Image from 'next/image';
import { Message } from '@/lib/types';
import { 
  MessageSquare, 
  Inbox, 
  Send, 
  MapPin, 
  DollarSign, 
  User,
  Building2,
  Clock,
  CheckCircle2,
  Circle
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'inbox' | 'sent';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const queryClient = useQueryClient();

  // Fetch inbox messages
  const { data: inboxData, isLoading: inboxLoading, error: inboxError } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: () => messagesApi.getInbox(),
  });

  // Fetch sent messages
  const { data: sentData, isLoading: sentLoading, error: sentError } = useQuery({
    queryKey: ['messages', 'sent'],
    queryFn: () => messagesApi.getSent(),
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => messagesApi.getUnreadCount(),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => messagesApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message marked as read');
    },
  });

  const normalizeMessages = (data: unknown): Message[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as Message[];
    
    const anyData = data as any;
    if (anyData.messages && Array.isArray(anyData.messages)) {
      return anyData.messages as Message[];
    }
    if (anyData.data && Array.isArray(anyData.data)) {
      return anyData.data as Message[];
    }
    return [];
  };

  const transformMessage = (msg: any): Message => {
    return {
      id: msg.id || '',
      senderId: msg.senderId || '',
      receiverId: msg.receiverId || '',
      propertyId: msg.propertyId || msg.property?.id || '',
      content: msg.content || '',
      isRead: msg.isRead ?? false,
      createdAt: msg.createdAt || new Date().toISOString(),
      sender: msg.sender || {
        id: msg.senderId || '',
        firstName: msg.senderFirstName || '',
        lastName: msg.senderLastName || '',
      },
      receiver: msg.receiver || {
        id: msg.receiverId || '',
        firstName: msg.receiverFirstName || '',
        lastName: msg.receiverLastName || '',
      },
      property: {
        id: msg.property?.id || msg.propertyId || '',
        title: msg.property?.title || 'Unknown Property',
        location: msg.property?.location || '',
        price: typeof msg.property?.price === 'number' 
          ? msg.property.price.toString() 
          : (msg.property?.price?.toString() || '0'),
        images: Array.isArray(msg.property?.images)
          ? msg.property.images.map((img: any, index: number) => 
              typeof img === 'string' 
                ? { id: `img-${index}`, url: img, publicId: '', propertyId: '' }
                : { id: img.id || `img-${index}`, url: img.url || img, publicId: img.publicId || '', propertyId: '' }
            )
          : [],
        description: msg.property?.description || '',
        status: (msg.property?.status as any) || 'published',
        ownerId: msg.property?.ownerId || '',
      },
    };
  };

  const inboxList = normalizeMessages(inboxData);
  const sentList = normalizeMessages(sentData);
  const transformedInboxList = inboxList.map(transformMessage);
  const transformedSentList = sentList.map(transformMessage);

  const handleMessageClick = (message: Message) => {
    if (activeTab === 'inbox' && !message.isRead && message.id) {
      markAsReadMutation.mutate(message.id);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
            Messages
          </h1>
          <p className="text-gray-600">View and manage your messages</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'inbox'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Inbox className="w-5 h-5" />
                <span>Inbox</span>
                {unreadCount && unreadCount.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {unreadCount.count}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Sent</span>
              </button>
            </nav>
          </div>

          {/* Messages List */}
          <div className="p-6">
            {activeTab === 'inbox' ? (
              <>
                {inboxLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading messages...</p>
                  </div>
                ) : transformedInboxList.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No messages in your inbox</p>
                    <p className="text-gray-500 text-sm mt-2">Messages from property owners will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transformedInboxList.map((message) => (
                      <Link
                        key={message.id}
                        href={`/properties/${message.propertyId}`}
                        onClick={() => handleMessageClick(message)}
                        className={`block border rounded-lg p-4 hover:shadow-md transition-all ${
                          !message.isRead
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Property Image */}
                          {message.property.images?.[0] && (
                            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={typeof message.property.images[0] === 'string' 
                                  ? message.property.images[0] 
                                  : message.property.images[0].url}
                                alt={message.property.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {!message.isRead && (
                                    <Circle className="w-2 h-2 text-blue-600 fill-current" />
                                  )}
                                  <p className="font-semibold text-gray-900">
                                    From: {message.sender.firstName} {message.sender.lastName}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                  <Building2 className="w-4 h-4" />
                                  <span className="font-medium">{message.property.title}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  {message.property.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{message.property.location}</span>
                                    </div>
                                  )}
                                  {message.property.price && (
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span>{parseFloat(message.property.price).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-1">
                                {!message.isRead && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                    New
                                  </span>
                                )}
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 line-clamp-2 mt-2">{message.content}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {sentLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading messages...</p>
                  </div>
                ) : transformedSentList.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No sent messages</p>
                    <p className="text-gray-500 text-sm mt-2">Messages you send will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transformedSentList.map((message) => (
                      <Link
                        key={message.id}
                        href={`/properties/${message.propertyId}`}
                        className="block border rounded-lg p-4 bg-white border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Property Image */}
                          {message.property.images?.[0] && (
                            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={typeof message.property.images[0] === 'string' 
                                  ? message.property.images[0] 
                                  : message.property.images[0].url}
                                alt={message.property.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <p className="font-semibold text-gray-900">
                                    To: {message.receiver?.firstName || 'Unknown'} {message.receiver?.lastName || ''}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                  <Building2 className="w-4 h-4" />
                                  <span className="font-medium">{message.property.title}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  {message.property.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{message.property.location}</span>
                                    </div>
                                  )}
                                  {message.property.price && (
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span>{parseFloat(message.property.price).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 line-clamp-2 mt-2">{message.content}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
