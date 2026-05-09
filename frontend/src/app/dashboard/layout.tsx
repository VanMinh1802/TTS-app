import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng điều khiển",
  description: "Quản lý tài khoản và theo dõi mức sử dụng dịch vụ TTS Type2Vibe.",
  robots: { index: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
