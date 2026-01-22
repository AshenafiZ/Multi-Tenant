'use client';

import ProtectedRoute from '@/components/protected-route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api/properties';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Eye, Trash2, MapPin, DollarSign, Upload } from 'lucide-react';
import { useState } from 'react';
import CreatePropertyModal from '@/components/create-property-modal';
import EditPropertyModal from '@/components/edit-property-modal';
import ImageUploadModal from '@/components/image-upload-modal';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<any>(null);
  const [uploadPropertyId, setUploadPropertyId] = useState<string | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', 'owner'],
    queryFn: () => propertiesApi.getProperties({ status: undefined, page: 1, limit: 100 }),
  });

  const ownerProperties = properties?.data.filter((p) => p.ownerId === user?.id) || [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.publishProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property published successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish property');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    },
  });

  const handlePublish = (id: string) => {
    if (confirm('Are you sure you want to publish this property? It cannot be edited after publishing.')) {
      publishMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      deleteMutation.mutate(id);
    }
  };

  const draftCount = ownerProperties.filter((p) => p.status === 'draft').length;
  const publishedCount = ownerProperties.filter((p) => p.status === 'published').length;

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Create Property</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm">Total Properties</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{ownerProperties.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm">Draft</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{draftCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{publishedCount}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : ownerProperties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">You haven't created any properties yet.</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Create Your First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownerProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {property.images?.[0] && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={property.images[0].url}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        property.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center text-blue-600 font-bold mb-4">
                    <DollarSign className="w-5 h-5" />
                    <span>{parseFloat(property.price).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property.status === 'draft' && (
                      <>
                        <button
                          onClick={() => setEditProperty(property)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setUploadPropertyId(property.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Images</span>
                        </button>
                        <button
                          onClick={() => handlePublish(property.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Publish</span>
                        </button>
                      </>
                    )}
                    <Link
                      href={`/properties/${property.id}`}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {createModalOpen && (
          <CreatePropertyModal
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              setCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['properties'] });
            }}
          />
        )}

        {editProperty && (
          <EditPropertyModal
            property={editProperty}
            onClose={() => setEditProperty(null)}
            onSuccess={() => {
              setEditProperty(null);
              queryClient.invalidateQueries({ queryKey: ['properties'] });
            }}
          />
        )}

        {uploadPropertyId && (
          <ImageUploadModal
            propertyId={uploadPropertyId}
            onClose={() => setUploadPropertyId(null)}
            onSuccess={() => {
              setUploadPropertyId(null);
              queryClient.invalidateQueries({ queryKey: ['properties'] });
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

