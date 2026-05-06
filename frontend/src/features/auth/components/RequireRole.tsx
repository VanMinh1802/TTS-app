'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { AccessDenied } from './AccessDenied';
import type { UserRole } from '../types';

interface RequireRoleProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export function RequireRole({ children, roles, fallback }: RequireRoleProps) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return fallback ?? <AccessDenied />;
  }

  const hasRole = roles.includes('admin') ? user.is_admin : true;

  if (!hasRole) {
    return fallback ?? <AccessDenied />;
  }

  return <>{children}</>;
}
