'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { propertiesApi } from '@/lib/api/properties';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Edit, Eye, Trash2, Ban } from 'lucide-react';
import EditPropertyModal from './edit-property-modal';
import ConfirmationModal from './confirmation-modal';
import type { Property } from '@/lib/types';

interface PropertyActionsProps {
  property: Property;
}

export default function PropertyActions({ property }: PropertyActionsProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'publish' | 'delete' | 'archive' | null;
  }>({ isOpen: false, type: null });

  // All hooks must be called before any conditional returns
  const publishMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.publishProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property published successfully!');
      router.refresh();
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
      router.push('/dashboard/owner');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    },
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.disableProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property archived successfully!');
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to archive property');
    },
  });

  // Check permissions after all hooks are called
  const isOwner = user?.id === property.ownerId;
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;

  if (!canManage) {
    return null;
  }

  const handlePublish = () => {
    setConfirmModal({ isOpen: true, type: 'publish' });
  };

  const handleDelete = () => {
    setConfirmModal({ isOpen: true, type: 'delete' });
  };

  const handleDisable = () => {
    setConfirmModal({ isOpen: true, type: 'archive' });
  };

  const handleConfirm = () => {
    if (confirmModal.type === 'publish') {
      publishMutation.mutate(property.id);
    } else if (confirmModal.type === 'delete') {
      deleteMutation.mutate(property.id);
    } else if (confirmModal.type === 'archive') {
      disableMutation.mutate(property.id);
    }
    setConfirmModal({ isOpen: false, type: null });
  };

  const getModalConfig = () => {
    switch (confirmModal.type) {
      case 'publish':
        return {
          title: 'Publish Property',
          message: 'Are you sure you want to publish this property? It will be visible to all users and cannot be edited after publishing.',
          confirmText: 'Publish',
          variant: 'info' as const,
          isLoading: publishMutation.isPending,
        };
      case 'delete':
        return {
          title: 'Delete Property',
          message: 'Are you sure you want to delete this property? This action cannot be undone.',
          confirmText: 'Delete',
          variant: 'danger' as const,
          isLoading: deleteMutation.isPending,
        };
      case 'archive':
        return {
          title: 'Archive Property',
          message: 'Are you sure you want to archive this property? It will be hidden from regular users but can be restored later.',
          confirmText: 'Archive',
          variant: 'warning' as const,
          isLoading: disableMutation.isPending,
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure?',
          confirmText: 'Confirm',
          variant: 'info' as const,
          isLoading: false,
        };
    }
  };

  return (
    <>
      <div className="border-t pt-6 mt-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Management</h3>
          <div className="flex flex-wrap gap-3">
            {(property.status === 'draft' || property.status === 'published') && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Property</span>
              </button>
            )}
            
            {property.status === 'draft' && (
              <button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                <span>{publishMutation.isPending ? 'Publishing...' : 'Publish Property'}</span>
              </button>
            )}

            {isAdmin && property.status === 'published' && (
              <button
                onClick={handleDisable}
                disabled={disableMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>{disableMutation.isPending ? 'Archiving...' : 'Archive Property'}</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete Property'}</span>
            </button>
          </div>
        </div>
      </div>

      {editModalOpen && (
        <EditPropertyModal
          property={property}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            router.refresh();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={handleConfirm}
        {...getModalConfig()}
      />
    </>
  );
}

