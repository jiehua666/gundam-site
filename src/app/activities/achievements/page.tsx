"use client";

import AchievementList from "@/components/activities/AchievementList";

export default function AchievementsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
            成就中心
          </h1>
          <p className="text-muted-foreground">
            解锁全部 27 个成就，成为高达达人
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <AchievementList showHeader={true} />
        </div>
      </section>
    </div>
  );
}
