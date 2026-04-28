import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gundam.site";

export const metadata: Metadata = {
  title: "机体库 - 浏览全部高达机体",
  description: "浏览所有高达机体，查看详细参数和配色方案。支持按系列、等级、分类筛选。",
  keywords: ["高达机体", "钢弹模型", "机体库", "比例模型", "RG", "MG", "PG", "HG"],
  openGraph: {
    title: "机体库 | GUNDAM SITE",
    description: "浏览所有高达机体，查看详细参数和配色方案",
    url: `${BASE_URL}/mechas`,
    images: [`${BASE_URL}/og-mechas.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/mechas`,
  },
};

export default function MechasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
