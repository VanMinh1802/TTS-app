import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Quản lý khóa API cho tích hợp TTS Type2Vibe vào ứng dụng của bạn.",
  robots: { index: false },
};

export default function ApiKeysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
