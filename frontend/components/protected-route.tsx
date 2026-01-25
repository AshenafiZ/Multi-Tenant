'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);
  const isChecking = useRef(false);

  useEffect(() => {
    // Don't check auth on login/register pages
    if (pathname === '/login' || pathname === '/register') {
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous checks
    if (isChecking.current) {
      return;
    }

    const checkAuth = async () => {
      // ✅ FAST CHECK: If we have token AND user in store, use it immediately
      const token = Cookies.get('accessToken');
      if (token && user && isAuthenticated) {
        // Role check with store user
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.replace('/');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }

      isChecking.current = true;

      if (!token) {
        isChecking.current = false;
        setIsLoading(false);
        router.replace(redirectTo);
        return;
      }

      // Verify token and get fresh user data
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        
        if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
          router.replace('/');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        router.replace(redirectTo);
        setIsLoading(false);
        return;
      } finally {
        isChecking.current = false;
        setIsLoading(false);
      }
    };

    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [router, pathname, user, isAuthenticated, allowedRoles, redirectTo, setUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
