'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { messagesApi } from '@/lib/api/messages';
import { propertiesApi } from '@/lib/api/properties';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Building2 } from 'lucide-react';
import Link from 'next/link';

interface ContactFormData {
  content: string;
}

export default function ContactPropertyOwnerPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchProperty = async () => {
      try {
        const propertyId = params.id as string;
        const data = await propertiesApi.getProperty(propertyId);
        console.log('Fetched property data:', data);
        
        // Validate that we have the necessary data
        if (!data || !data.id) {
          toast.error('Invalid property data received');
          router.push('/');
          return;
        }
        
        setProperty(data);
      } catch (error: any) {
        console.error('Error fetching property:', error);
        toast.error(error.response?.data?.message || 'Failed to load property details');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [params.id, isAuthenticated, router]);

  const onSubmit = async (data: ContactFormData) => {
    // Get ownerId from property.ownerId or property.owner.id
    const ownerId = property?.ownerId || property?.owner?.id;
    
    if (!property || !ownerId) {
      console.error('Property data:', property);
      toast.error('Property owner information not available. Please try again or contact support.');
      return;
    }

    if (!property.id) {
      toast.error('Property ID is missing. Please try again.');
      return;
    }

    setIsSending(true);
    try {
      await messagesApi.sendMessage({
        receiverId: ownerId,
        propertyId: property.id,
        content: data.content,
      });
      toast.success('Message sent successfully!');
      router.push(`/properties/${property.id}`);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  // Get ownerId from property.ownerId or property.owner.id
  const ownerId = property?.ownerId || property?.owner?.id;
  const hasOwnerInfo = !!ownerId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/properties/${property.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Property
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Contact Property Owner</h1>
                <p className="text-blue-100 mt-1">Send a message to the property owner</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Property Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Building2 className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">{property.title}</h3>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  {property.owner && (
                    <p className="text-sm text-gray-600 mt-1">
                      Owner: {property.owner.firstName} {property.owner.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning if owner info is missing */}
            {!hasOwnerInfo && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Warning:</strong> Owner information is not available for this property. 
                  Please contact support or try again later.
                </p>
              </div>
            )}

            {/* Contact Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  {...register('content', {
                    required: 'Message is required',
                    minLength: {
                      value: 10,
                      message: 'Message must be at least 10 characters long',
                    },
                  })}
                  id="content"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your message to the property owner here. Include any questions about the property, scheduling a viewing, or other inquiries..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Link
                  href={`/properties/${property.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSending || !hasOwnerInfo}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>

            {/* Alternative Contact */}
            {property.owner && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Alternative:</strong> You can also contact the owner directly via email:
                </p>
                <a
                  href={`mailto:${property.owner.email}?subject=Inquiry about ${encodeURIComponent(property.title)}`}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {property.owner.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

