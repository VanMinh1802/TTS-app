'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { UpgradePrompt } from './UpgradePrompt';

type Tier = 'free' | 'pro' | 'enterprise';

interface RequireTierProps {
  children: ReactNode;
  tiers: Tier[];
  fallback?: ReactNode;
}

const tierHierarchy: Record<Tier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function RequireTier({ children, tiers, fallback }: RequireTierProps) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return fallback ?? <UpgradePrompt />;
  }

  const userTier = user.subscription_tier as Tier;
  const userLevel = tierHierarchy[userTier] ?? 0;
  const requiredLevel = Math.min(...tiers.map(t => tierHierarchy[t] ?? 0));

  if (userLevel < requiredLevel) {
    return fallback ?? <UpgradePrompt />;
  }

  return <>{children}</>;
}
