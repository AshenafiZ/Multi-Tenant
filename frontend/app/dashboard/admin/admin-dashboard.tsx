'use client';

import ProtectedRoute from '@/components/protected-route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api/properties';
import { usersApi } from '@/lib/api/users';
import Image from 'next/image';
import { Shield, Building2, Ban, Eye, Trash2, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import CreatePropertyModal from '@/components/create-property-modal';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'properties' | 'users'>('properties');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Read tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'users' || tab === 'properties') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'properties' | 'users') => {
    setActiveTab(tab);
    router.push(`/dashboard/admin?tab=${tab}`, { scroll: false });
  };

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', 'admin'],
    queryFn: () => propertiesApi.getProperties({ page: 1, limit: 100, includeDeleted: true }),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.disableProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property disabled successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disable property');
    },
  });

  const handleDisable = (id: string) => {
    if (confirm('Are you sure you want to disable this property?')) {
      disableMutation.mutate(id);
    }
  };

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => usersApi.getAll({ page: 1, limit: 100, includeDeleted: true }),
    retry: 1,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const allProperties = properties?.data || [];
  const publishedCount = allProperties.filter((p) => p.status === 'published' && !p.deletedAt).length;
  const draftCount = allProperties.filter((p) => p.status === 'draft' && !p.deletedAt).length;
  const archivedCount = allProperties.filter((p) => p.status === 'archived' && !p.deletedAt).length;
  const deletedCount = allProperties.filter((p) => p.deletedAt).length;

  const allUsers = usersData?.data || [];
  const adminCount = allUsers.filter((u) => u.role === 'admin' && !u.deletedAt).length;
  const ownerCount = allUsers.filter((u) => u.role === 'owner' && !u.deletedAt).length;
  const userCount = allUsers.filter((u) => u.role === 'user' && !u.deletedAt).length;
  const deletedUsersCount = allUsers.filter((u) => u.deletedAt).length;

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-2 mb-8">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('properties')}
              className={`${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Building2 className="w-5 h-5" />
              <span>Properties</span>
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </button>
          </nav>
        </div>

        {activeTab === 'properties' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Properties Management</h2>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>Create Property</span>
              </button>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{allProperties.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{publishedCount}</p>
              </div>
              <Building2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Draft</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{draftCount}</p>
              </div>
              <Building2 className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Archived</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{archivedCount}</p>
              </div>
              <Building2 className="w-12 h-12 text-gray-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Deleted</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{deletedCount}</p>
              </div>
              <Building2 className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">All Properties</h2>
          {propertiesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : allProperties.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No properties found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allProperties.map((property) => (
                    <tr key={property.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {property.images?.[0] && (
                            <div className="relative w-12 h-12 mr-3">
                              <Image
                                src={property.images[0].url}
                                alt={property.title}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{property.title}</div>
                            <div className="text-sm text-gray-500">{property.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.owner?.firstName} {property.owner?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              property.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : property.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {property.status}
                          </span>
                          {property.deletedAt && (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Deleted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(property.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                        {property.status === 'published' && !property.deletedAt && (
                          <button
                            onClick={() => handleDisable(property.id)}
                            className="text-yellow-600 hover:text-yellow-900 inline-flex items-center"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Archive
                          </button>
                        )}
                        {!property.deletedAt && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this property?')) {
                                propertiesApi.deleteProperty(property.id).then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['properties'] });
                                  toast.success('Property deleted successfully!');
                                }).catch((error: any) => {
                                  toast.error(error.response?.data?.message || 'Failed to delete property');
                                });
                              }
                            }}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
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

        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{allUsers.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Admins</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{adminCount}</p>
                  </div>
                  <Shield className="w-12 h-12 text-purple-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Owners</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{ownerCount}</p>
                  </div>
                  <Users className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Users</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{userCount}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Deleted</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{deletedUsersCount}</p>
                  </div>
                  <Users className="w-12 h-12 text-red-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">All Users</h2>
              {usersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : usersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">Error loading users</p>
                  <p className="text-sm text-gray-600">
                    {usersError instanceof Error 
                      ? usersError.message 
                      : (usersError as any)?.response?.data?.message || 'Unknown error'}
                  </p>
                  {(usersError as any)?.response?.status === 400 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Status: {(usersError as any)?.response?.status} - Bad Request
                    </p>
                  )}
                </div>
              ) : allUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No users found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map((user: User) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'owner'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {user.deletedAt && (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Deleted
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!user.deletedAt && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

