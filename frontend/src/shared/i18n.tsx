"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";

const DEFAULT_LOCALE = "vi";

type Messages = Record<string, Record<string, string>>;

const allMessages: Record<string, Messages> = {
  vi: viMessages as Messages,
  en: enMessages as Messages,
};

const I18nContext = createContext<{ locale: string; messages: Messages }>({
  locale: DEFAULT_LOCALE,
  messages: allMessages[DEFAULT_LOCALE],
});



function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function useT(): Messages {
  const { messages } = useContext(I18nContext);
  return messages;
}

export function I18nProvider({ children, locale }: { children: ReactNode; locale?: string }) {
  const resolvedLocale = locale || DEFAULT_LOCALE;
  const messages = allMessages[resolvedLocale] || allMessages[DEFAULT_LOCALE];

  return (
    <I18nContext.Provider value={{ locale: resolvedLocale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}