import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
  description: "Studio TTS — tạo giọng nói AI từ văn bản trực tuyến với công nghệ AI tiên tiến.",
  robots: { index: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
