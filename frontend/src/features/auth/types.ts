export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_expires_at: string | null;
  subscription_activated_at: string | null;
  created_at: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  status: AuthStatus;
  user: AuthUser | null;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}
