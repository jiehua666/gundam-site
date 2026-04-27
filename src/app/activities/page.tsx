"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Gift, Trophy, Clock, CheckCircle, Grid3X3, Target } from "lucide-react";
import CheckinCard from "@/components/activities/CheckinCard";
import CardCollection from "@/components/activities/CardCollection";

interface Mission {
  id: string;
  name: string;
  description: string | null;
  type: string;
  xpReward: number;
  progress?: number;
  completed?: boolean;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<Record<string, { progress: number; completed: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [activeSection, setActiveSection] = useState<"missions" | "achievements" | "cards">("missions");

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    setIsLoading(true);
    try {
      // 并行获取任务列表和用户进度
      const [missionsRes, userMissionsRes] = await Promise.all([
        fetch('/api/missions'),
        fetch('/api/user-missions').catch(() => null),
      ]);

      const missionsData = await missionsRes.json();
      setMissions(missionsData.missions || []);

      // 设置用户进度
      if (userMissionsRes?.ok) {
        const userData = await userMissionsRes.json();
        const progressMap: Record<string, { progress: number; completed: boolean }> = {};

        // 合并所有任务类型的进度
        [...(userData.dailyMissions || []), ...(userData.weeklyMissions || []), ...(userData.achievements || [])].forEach((m: Mission) => {
          progressMap[m.id] = { progress: m.progress || 0, completed: m.completed || false };
        });

        setUserMissions(progressMap);
      }
    } catch (error) {
      console.error("Failed to fetch missions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-6 h-6 text-primary" />;
      case 'weekly':
        return <Calendar className="w-6 h-6 text-accent" />;
      case 'achievement':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      default:
        return <Gift className="w-6 h-6 text-primary" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'daily':
        return '每日任务';
      case 'weekly':
        return '每周任务';
      case 'achievement':
        return '成就';
      default:
        return '任务';
    }
  };

  const getMissionButtonText = (mission: Mission) => {
    switch (mission.name) {
      case '每日签到':
        return '去签到';
      case '每日登录':
        return '去登录';
      case '首次评论':
        return '去评论';
      case '首次作品':
        return '发布作品';
      case '完善资料':
        return '去完善';
      case '获得10赞':
        return '查看作品';
      case '关注5人':
        return '去关注';
      case '评论10次':
        return '去评论';
      default:
        return '前往';
    }
  };

  const handleMissionAction = (mission: Mission) => {
    console.log('Button clicked, mission:', mission.name);

    if (mission.name === '每日签到') {
      // 显示签到卡片并滚动
      setShowCheckin(true);
      setTimeout(() => {
        const checkinEl = document.getElementById('checkin-section');
        if (checkinEl) {
          const top = checkinEl.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    } else if (mission.name === '每日登录') {
      router.push('/');
    } else if (mission.name === '首次评论') {
      router.push('/creations');
    } else if (mission.name === '首次作品') {
      router.push('/creations/new');
    } else if (mission.name === '完善资料') {
      router.push('/settings');
    } else if (mission.name === '获得10赞') {
      router.push('/creations');
    } else if (mission.name === '关注5人') {
      router.push('/rankings');
    } else if (mission.name === '评论10次') {
      router.push('/creations');
    } else {
      console.log('Unknown mission:', mission.name);
    }
  };

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

      {/* Section Tabs */}
      <section className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-3">
            <button
              onClick={() => setActiveSection("missions")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeSection === "missions"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
              }`}
            >
              <Target className="w-4 h-4" />
              任务
            </button>
            <button
              onClick={() => setActiveSection("achievements")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeSection === "achievements"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
              }`}
            >
              <Trophy className="w-4 h-4" />
              成就
            </button>
            <button
              onClick={() => setActiveSection("cards")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeSection === "cards"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              卡牌
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Cards Section */}
          {activeSection === "cards" && (
            <div className="mb-8">
              <CardCollection />
            </div>
          )}

          {/* Missions & Achievements Section */}
          {(activeSection === "missions" || activeSection === "achievements") && (
            <>
              {/* Checkin Card - 默认隐藏，点击"去签到"后显示 */}
              {showCheckin && (
                <div id="checkin-section" className="mb-8">
                  <CheckinCard />
                </div>
              )}

              {/* Section Title */}
              <div className="flex items-center gap-2 mb-6">
                {activeSection === "missions" ? (
                  <Target className="w-5 h-5 text-primary" />
                ) : (
                  <Trophy className="w-5 h-5 text-primary" />
                )}
                <h2 className="text-xl font-bold text-foreground">
                  {activeSection === "missions" ? "任务列表" : "成就列表"}
                </h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : missions.filter(m => activeSection === "missions" ? m.type !== 'achievement' : m.type === 'achievement').length === 0 ? (
                <div className="text-center py-20">
                  {activeSection === "missions" ? (
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  ) : (
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  )}
                  <p className="text-muted-foreground">暂无{activeSection === "missions" ? "任务" : "成就"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {missions
                    .filter(m => activeSection === "missions" ? m.type !== 'achievement' : m.type === 'achievement')
                    .map((mission) => {
                      const userProgress = userMissions[mission.id];
                      const isCompleted = userProgress?.completed || mission.completed;

                      return (
                        <div key={mission.id} className="glass-card neon-border-hover rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isCompleted ? "bg-green-500/20" : "bg-primary/20"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                getIcon(mission.type)
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground">{mission.name}</h3>
                              <span className="text-xs text-primary">{getTypeName(mission.type)}</span>
                            </div>
                          </div>
                          {mission.description && (
                            <p className="text-muted-foreground text-sm mb-4">
                              {mission.description}
                            </p>
                          )}

                          {/* Progress Bar */}
                          {mission.type === 'progress' && userProgress && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>进度</span>
                                <span>{userProgress.progress} / 1</span>
                              </div>
                              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${Math.min((userProgress.progress / 1) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-accent">+{mission.xpReward} XP</span>
                            {isCompleted ? (
                              <span className="px-4 py-2 rounded-lg bg-green-500/20 text-green-500 text-sm font-medium">
                                已完成
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMissionAction(mission)}
                                className="px-4 py-2 rounded-lg cyber-button text-sm"
                              >
                                {getMissionButtonText(mission)}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
