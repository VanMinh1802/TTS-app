'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
}

export function RequireAuth({ children, loadingFallback }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return loadingFallback ? <>{loadingFallback}</> : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
