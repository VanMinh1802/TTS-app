import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kích hoạt",
  description: "Kích hoạt tài khoản Type2Vibe để bắt đầu sử dụng dịch vụ TTS.",
  robots: { index: false, follow: false },
};

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
