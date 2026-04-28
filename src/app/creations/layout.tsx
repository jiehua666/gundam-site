import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gundam.site";

export const metadata: Metadata = {
  title: "作品区 - 创作者精彩作品",
  description: "欣赏创作者们的精彩作品，发现灵感。查看热门作品、创作者排行。",
  keywords: ["高达作品", "二次创作", "高达绘画", "高达摄影", "创作者", "作品集"],
  openGraph: {
    title: "作品区 | GUNDAM SITE",
    description: "欣赏创作者们的精彩作品，发现灵感",
    url: `${BASE_URL}/creations`,
    images: [`${BASE_URL}/og-creations.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/creations`,
  },
};

export default function CreationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
