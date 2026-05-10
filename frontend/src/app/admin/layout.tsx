import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản trị",
  description: "Trang quản trị Type2Vibe — quản lý người dùng và giấy phép.",
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
