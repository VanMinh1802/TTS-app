import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Từ điển",
  description: "Tra cứu và tùy chỉnh cách phát âm từ điển tiếng Việt. Tạo danh sách từ vựng cá nhân để TTS đọc chính xác.",
};

export default function DictionaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
