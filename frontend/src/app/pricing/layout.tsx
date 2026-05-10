import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng giá",
  description: "Khám phá các gói dịch vụ TTS Type2Vibe với mức giá linh hoạt phù hợp cho cá nhân và doanh nghiệp.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
