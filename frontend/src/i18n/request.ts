import { routing } from "./routing";

export default async function getRequestConfig() {
  const locale = routing.defaultLocale;
  
  const messages = {
    vi: (await import("@/messages/vi.json")).default,
    en: (await import("@/messages/en.json")).default,
  };
  
  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  };
}