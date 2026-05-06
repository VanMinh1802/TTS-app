"use client";

import { type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { I18nProvider } from "@/shared/i18n";
import { NotificationProvider } from "@/shared/notifications/notification-store";
import { AuthProvider } from "@/features/auth";

export function AppProviders({ children }: { children: ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <AuthProvider>
      <I18nProvider>
        <NotificationProvider>
          {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              {children}
            </GoogleOAuthProvider>
          ) : (
            children
          )}
        </NotificationProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
