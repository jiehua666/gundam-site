"use client";

import { CheckCircle } from "lucide-react";
import CheckinCard from "@/components/activities/CheckinCard";
import MissionList from "@/components/activities/MissionList";

export default function MissionsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
            任务中心
          </h1>
          <p className="text-muted-foreground">
            完成每日任务和每周任务，获取 XP 奖励
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Checkin Card - Always visible on missions page */}
          <div className="mb-8">
            <CheckinCard />
          </div>

          {/* Mission List */}
          <MissionList showHeader={true} />
        </div>
      </section>
    </div>
  );
}
