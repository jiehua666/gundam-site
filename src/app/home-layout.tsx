import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gundam.site";

export const metadata: Metadata = {
  title: "GUNDAM SITE - 机体百科 + 创作者社区",
  description: "高达机体百科全书，收录全系列高达机体详细参数、配色方案。创作者社区，欣赏精彩作品，发现灵感。",
  keywords: ["高达", "GUNDAM", "机体百科", "钢弹", "模型", "高达模型", "创作者", "二次创作"],
  openGraph: {
    title: "GUNDAM SITE - 机体百科 + 创作者社区",
    description: "高达机体百科全书，收录全系列高达机体详细参数、配色方案。创作者社区，欣赏精彩作品，发现灵感。",
    url: BASE_URL,
    images: [`${BASE_URL}/og-home.png`],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
