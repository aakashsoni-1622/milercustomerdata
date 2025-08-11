"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { UserRole } from '@/lib/auth';

const Navigation = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      {
        name: 'Home',
        href: '/',
        icon: '🏠',
        roles: [UserRole.VIEWER, UserRole.CUSTOMER_SUPPORT, UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN]
      },
      {
        name: 'Customers',
        href: '/customers',
        icon: '👥',
        roles: [UserRole.CUSTOMER_SUPPORT, UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN]
      },
      {
        name: 'Products',
        href: '/products',
        icon: '📦',
        roles: [UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN]
      },
      // {
      //   name: 'Add Order',
      //   href: '/add-order-v2',
      //   icon: '➕',
      //   roles: [UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN]
      // },
      {
        name: 'Bulk Orders',
        href: '/add-bulk-orders',
        icon: '📝',
        roles: [UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
      },
      {
        name: 'Orders Management',
        href: '/orders-management',
        icon: '✏️',
        roles: [UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN, UserRole.SUPER_ADMIN]
      },
      {
        name: 'Users',
        href: '/users',
        icon: '👤',
        roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
      }
    ];

    return items.filter(item => item.roles.includes(user.role as UserRole));
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.OPERATIONS:
        return 'bg-blue-100 text-blue-800';
      case UserRole.CUSTOMER_SUPPORT:
        return 'bg-green-100 text-green-800';
      case UserRole.VIEWER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Miler CRM
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {user.firstName?.[0] || user.username[0].toUpperCase()}
                    </span>
                  </div>
                  {/* User Info */}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName} ({user.username})
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role as UserRole)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                      {user.department && (
                        <span className="text-xs text-gray-500">
                          • {user.department}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Dropdown Arrow */}
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* Mobile Navigation (visible on small screens) */}
                    <div className="sm:hidden">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center px-4 py-2 text-sm ${
                            pathname === item.href
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-3">{item.icon}</span>
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100"></div>
                    </div>

                    {/* User Info (mobile) */}
                    <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user.role as UserRole)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Profile Link */}
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>

                    {/* Settings Link (Admin only) */}
                    {[UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role as UserRole) && (
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                    )}

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;