import type { Metadata, Viewport } from "next";
import { Share_Tech_Mono, Inter, Fira_Code } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gundam.site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "GUNDAM SITE - 机体百科 + 创作者社区",
    template: "%s | GUNDAM SITE",
  },
  description: "高达机体百科全书，收录全系列高达机体详细参数、配色方案。创作者社区，欣赏精彩作品，发现灵感。",
  keywords: [
    "高达",
    "GUNDAM",
    "机体百科",
    "钢弹",
    "模型",
    "高达模型",
    "创作者",
    "二次创作",
    "比例模型",
    "高达系列",
  ],
  authors: [{ name: "GUNDAM SITE" }],
  creator: "GUNDAM SITE",
  publisher: "GUNDAM SITE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "GUNDAM SITE",
    title: "GUNDAM SITE - 机体百科 + 创作者社区",
    description: "高达机体百科全书，收录全系列高达机体详细参数、配色方案。创作者社区，欣赏精彩作品，发现灵感。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GUNDAM SITE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GUNDAM SITE - 机体百科 + 创作者社区",
    description: "高达机体百科全书，收录全系列高达机体详细参数、配色方案。",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${shareTechMono.variable} ${inter.variable} ${firaCode.variable} min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <TooltipProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
