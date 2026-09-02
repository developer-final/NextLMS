import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "World Trading Lab - Nền tảng Đào tạo Giao dịch & Đầu tư Chuyên sâu",
  description:
    "Học viện đào tạo trực tuyến thực chiến về Giao dịch Tài chính, SMC, Đầu tư Chứng khoán, Crypto và Phân tích Kỹ thuật với hệ thống bài giảng video chất lượng cao.",
  keywords: ["e-learning", "world trading lab", "trading courses", "hoc forex", "chung khoan", "khoa hoc online", "fintech academy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-brand-500 selection:text-slate-950"
        suppressHydrationWarning
      >
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider />
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
