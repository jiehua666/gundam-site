import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "GUNDAM SITE",
  description: "机体百科 + 创作者社区",
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
