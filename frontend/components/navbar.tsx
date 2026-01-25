'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Home, LogOut, User, Building2, Settings, MessageSquare, Users, Plus } from 'lucide-react';

export function Navbar() {
  // Only subscribe to what we need to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'owner':
        return '/dashboard/owner';
      case 'user':
        return '/dashboard/user';
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600">
            <Building2 className="w-6 h-6" />
            <span>PropertyHub</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
              <Home className="w-4 h-4" />
              <span>Properties</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/messages"
                  className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </Link>
                {(user?.role === 'admin' || user?.role === 'owner') && (
                  <Link
                    href={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/owner'}
                    className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                    onClick={(e) => {
                      // Open create modal on dashboard
                      const dashboardUrl = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/owner';
                      // We'll let the dashboard handle the modal, just navigate
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Property</span>
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    href="/dashboard/admin?tab=users"
                    className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Users</span>
                  </Link>
                )}
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()!}
                    className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{user?.firstName ?? 'User'} {user?.lastName ?? ''}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {user?.role ?? 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

