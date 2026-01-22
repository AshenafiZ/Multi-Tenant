'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Role } from '@/lib/types';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken');
      
      if (!token) {
        router.push(redirectTo);
        return;
      }

      // Verify token is valid by fetching current user
      if (!isAuthenticated || !user) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          router.push(redirectTo);
          return;
        }
      }

      // Check role if specified
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/');
        return;
      }
    };

    checkAuth();
  }, [isAuthenticated, user, allowedRoles, router, redirectTo, setUser]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

