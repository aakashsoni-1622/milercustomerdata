"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  role: string;
  username: string;
  firstName: string;
  lastName: string;
}

export default function UnauthorizedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // User is not logged in, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.log('Error in checkAuth:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>

          {/* Message */}
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this page.
          </p>

          {user && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Current User:</strong> {user.firstName} {user.lastName} ({user.username})
              </p>
              <p className="text-sm text-gray-700">
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="mt-6 text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Why am I seeing this?
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 mr-3"></span>
                Your current role doesn&apos;t have access to this resource
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 mr-3"></span>
                Contact your administrator to request access
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 mr-3"></span>
                You may need to log in with a different account
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Logout & Login as Different User
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact your system administrator or IT support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}