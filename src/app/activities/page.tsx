"use client";

import Link from "next/link";
import { Calendar, Target, Trophy, Grid3X3, ArrowRight } from "lucide-react";

const activityModules = [
  {
    title: '每日签到',
    description: '每日签到获取 XP 和随机卡牌',
    icon: Calendar,
    href: '/activities/missions',
    color: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'hover:border-green-500/50',
  },
  {
    title: '任务中心',
    description: '完成每日/每周任务获取奖励',
    icon: Target,
    href: '/activities/missions',
    color: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'hover:border-blue-500/50',
  },
  {
    title: '成就中心',
    description: '解锁 27 个成就，成为高达达人',
    icon: Trophy,
    href: '/activities/achievements',
    color: 'from-yellow-500/20 to-orange-500/20',
    borderColor: 'hover:border-yellow-500/50',
  },
  {
    title: '卡牌收藏',
    description: '收集稀有卡牌，展示你的高达情怀',
    icon: Grid3X3,
    href: '/activities/cards',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'hover:border-purple-500/50',
  },
];

export default function ActivitiesPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
            活动中心
          </h1>
          <p className="text-muted-foreground">
            参与任务赢取奖励，展示你的高达作品
          </p>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-medium text-foreground mb-4">快速入口</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activityModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className={`glass-card neon-border-hover rounded-xl p-6 bg-gradient-to-br ${module.color} ${module.borderColor} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon / Stats Placeholder */}
      <section className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-medium text-foreground mb-4">活动预告</h2>
          <div className="glass-card neon-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              更多精彩活动即将上线，敬请期待...
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
