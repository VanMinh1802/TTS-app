import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { StructuredData } from "@/components/seo/StructuredData";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://type2vibe.online"),
  title: {
    default: "Type2Vibe | Chuyển văn bản thành giọng nói Tiếng Việt",
    template: "%s | Type2Vibe",
  },
  description: "Nền tảng TTS chuyên nghiệp dành riêng cho Tiếng Việt. Phát âm chuẩn xác, tích hợp API dễ dàng.",
  keywords: ["TTS", "Text to Speech", "Tiếng Việt", "AI Voice", "Giọng nói nhân tạo", "Gemini"],
  authors: [{ name: "Type2Vibe Team" }],
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://type2vibe.online",
  },
  openGraph: {
    title: "Type2Vibe | Đừng chỉ gõ. Hãy để văn bản cất tiếng.",
    description: "Nền tảng TTS chuyên nghiệp, tích hợp API, độ trễ cực thấp.",
    url: "https://type2vibe.online",
    siteName: "Type2Vibe",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Type2Vibe | AI Text to Speech Tiếng Việt",
    description: "Nền tảng TTS chuyên nghiệp dành cho người sáng tạo và lập trình viên.",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body className={inter.variable}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#6366F1] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium no-underline">
          Bỏ qua nội dung
        </a>
        <ThemeProvider>
          <AppProviders>
            <Navbar />
            <main id="main-content" className="pt-16">{children}</main>
            <ToastContainer />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
