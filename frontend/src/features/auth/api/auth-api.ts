import { apiRequest } from "@/lib/api-client";
import { notifyAuthStateChanged } from "../lib/token-store";

export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  subscription_activated_at: string | null;
  is_admin: boolean;
  created_at: string | null;
}

export const loginWithGoogle = async (credential: string): Promise<GoogleLoginResponse> => {
  const data = await apiRequest<GoogleLoginResponse>("/auth/login/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

  notifyAuthStateChanged();
  return data;
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  return apiRequest<CurrentUserResponse>("/auth/me");
};

export const logout = async (): Promise<void> => {
  await apiRequest("/auth/logout", { method: "POST", allowEmpty: true });
  notifyAuthStateChanged();
};
