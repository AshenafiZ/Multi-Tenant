'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/auth-store';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirected = useRef(false);
  const isSubmitting = useRef(false);
  const [mounted, setMounted] = useState(false);
  const checkDone = useRef(false);

  // Only run on client to prevent hydration issues
  useEffect(() => {
    if (checkDone.current) return;
    checkDone.current = true;
    
    setMounted(true);
    
    // Check if already logged in - but only once and with a delay to prevent loops
    if (typeof window !== 'undefined' && !hasRedirected.current) {
      const token = Cookies.get('accessToken');
      if (token) {
        // Only redirect if we have a valid token and haven't redirected yet
        hasRedirected.current = true;
        // Use a longer delay to ensure page is fully loaded
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            window.location.replace('/');
          }
        }, 100);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Prevent any form of double submission
    if (isLoading || hasRedirected.current || isSubmitting.current) {
      return;
    }
    
    isSubmitting.current = true;
    setIsLoading(true);
    
    try {
      const response = await authApi.login(data);
      
      // Set tokens FIRST
      Cookies.set('accessToken', response.accessToken, { expires: 7 });
      Cookies.set('refreshToken', response.refreshToken, { expires: 7 });
      
      // Set user in store
      setUser(response.user);
      
      toast.success('Login successful!');
      
      // ✅ ROLE-BASED REDIRECT - uses response.user.role directly
      const roleRedirects: Record<string, string> = {
        'admin': '/dashboard/admin',
        'owner': '/dashboard/owner',
        'user': '/dashboard/user'
      };
      
      const redirectPath = roleRedirects[response.user.role] || '/';
      
      // Mark as redirected to prevent multiple redirects
      hasRedirected.current = true;
      isSubmitting.current = false;
      
      // Next.js router replace - clean navigation
      router.replace(redirectPath, { scroll: false });
      
    } catch (error: any) {
      isSubmitting.current = false;
      
      // Only show error if it's not a network error or if we have a response
      if (error.response) {
        const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error('Network error. Please check if the backend server is running.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  // Show loading state during SSR to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
