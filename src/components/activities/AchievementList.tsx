"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2 } from "lucide-react";
import MissionCard from "./MissionCard";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  type: string;
  xpReward: number;
  progress?: number;
  completed?: boolean;
}

interface AchievementListProps {
  showHeader?: boolean;
}

export default function AchievementList({ showHeader = true }: AchievementListProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Record<string, { progress: number; completed: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [missionsRes, userMissionsRes] = await Promise.all([
        fetch('/api/missions'),
        fetch('/api/user-missions').catch(() => null),
      ]);

      const missionsData = await missionsRes.json();
      setAchievements(missionsData.missions || []);

      if (userMissionsRes?.ok) {
        const userData = await userMissionsRes.json();
        const progressMap: Record<string, { progress: number; completed: boolean }> = {};

        (userData.achievements || []).forEach((a: Achievement) => {
          progressMap[a.id] = { progress: a.progress || 0, completed: a.completed || false };
        });

        setUserAchievements(progressMap);
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter only achievement missions
  const achievementList = achievements.filter(m => m.type === 'achievement');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">成就列表</h2>
        </div>
      )}

      {achievementList.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">暂无成就</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementList.map((achievement) => {
            const userProgress = userAchievements[achievement.id];
            return (
              <MissionCard
                key={achievement.id}
                id={achievement.id}
                name={achievement.name}
                description={achievement.description}
                type={achievement.type}
                xpReward={achievement.xpReward}
                progress={userProgress?.progress}
                completed={userProgress?.completed}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
