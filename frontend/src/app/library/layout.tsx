import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thư viện",
  description: "Thư viện file audio đã tạo — quản lý và tải xuống các bản ghi âm TTS.",
  robots: { index: false },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
