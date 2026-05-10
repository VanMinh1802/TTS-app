import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thư viện giọng nói",
  description: "Khám phá bộ sưu tập giọng nói AI Tiếng Việt chất lượng cao với nhiều giọng nam, nữ đa dạng.",
};

export default function VoicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
