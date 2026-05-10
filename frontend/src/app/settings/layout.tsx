import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cài đặt",
  description: "Quản lý cài đặt tài khoản Type2Vibe và tùy chỉnh trải nghiệm.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
