'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { 
  FileText, 
  Settings, 
  Home, 
  PlusCircle,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Edit3
} from 'lucide-react';

interface UnifiedSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({ 
  isCollapsed = false, 
  onToggle 
}) => {
  const pathname = usePathname();
  const { user } = useUser();

  const navigationItems = [
    {
      href: '/dashboard/unified',
      icon: Edit3,
      label: 'Resume Builder',
      active: pathname.startsWith('/dashboard/unified') || pathname.startsWith('/resume/')
    },
    {
      href: '/dashboard/quick-optimize',
      icon: Zap,
      label: 'Quick Optimize',
      active: pathname.startsWith('/dashboard/quick-optimize')
    },
    {
      href: '/dashboard/resumes',
      icon: FileText,
      label: 'My Resumes',
      active: pathname.startsWith('/dashboard/resumes')
    },
    {
      href: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      active: pathname === '/dashboard'
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: 'Settings',
      active: pathname === '/dashboard/settings'
    }
  ];

  return (
    <div className={`bg-white border-r border-reslo-blue/10 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-reslo-blue/10 bg-gradient-to-r from-reslo-blue/5 to-reslo-turquoise/5">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/Reslo_Logo_long.png" 
                alt="Reslo" 
                className="h-8 w-auto" 
              />
            </Link>
          )}
          
          {isCollapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-gradient-to-br from-reslo-blue to-reslo-turquoise rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
            </Link>
          )}
          
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="hover:bg-reslo-blue/10"
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-gradient-to-r from-reslo-blue/10 to-reslo-turquoise/10 text-reslo-blue border border-reslo-blue/20'
                    : 'text-gray-700 hover:bg-reslo-blue/5 hover:text-reslo-blue'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-reslo-blue/10">
        {user && (
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-reslo-blue to-reslo-turquoise rounded-full flex items-center justify-center">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName || user.emailAddresses[0]?.emailAddress}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </>
            )}
            
            <SignOutButton>
              <Button
                variant="ghost"
                size="sm"
                className={`hover:bg-red-50 hover:text-red-600 ${
                  isCollapsed ? 'w-8 h-8 p-0' : ''
                }`}
                title={isCollapsed ? 'Sign Out' : undefined}
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && <span className="ml-2">Sign Out</span>}
              </Button>
            </SignOutButton>
          </div>
        )}
      </div>
    </div>
  );
};