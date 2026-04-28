"use client";

import CardCollection from "@/components/activities/CardCollection";

export default function CardsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
            卡牌收藏
          </h1>
          <p className="text-muted-foreground">
            通过每日签到获取稀有卡牌，收集全部高达系列
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <CardCollection />
        </div>
      </section>
    </div>
  );
}
