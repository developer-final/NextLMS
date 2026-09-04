import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DemoNicheSwitcher from "@/components/demo/DemoNicheSwitcher";
import { SpeedInsights } from "@vercel/speed-insights/next";

const appName = process.env.APP_NAME || "World Trading Lab";
const appSlogan = process.env.APP_SLOGAN || "Nền tảng Đào tạo Chuyên sâu";
const appDescription =
  process.env.APP_DESCRIPTION ||
  "Học viện đào tạo trực tuyến thực chiến với hệ thống bài giảng video chất lượng cao.";

export const metadata: Metadata = {
  title: `${appName} - ${appSlogan}`,
  description: appDescription,
  keywords: ["e-learning", appName.toLowerCase(), "online courses", "khoa hoc online", "lms platform"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wti_theme_pref')||document.cookie.match(/wti_theme=([^;]+)/)?.[1]||'emerald';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-background text-slate-100 flex flex-col antialiased selection:bg-brand-500 selection:text-slate-950"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <ToastProvider />
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
              <DemoNicheSwitcher />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
