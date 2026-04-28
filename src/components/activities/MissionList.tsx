"use client";

import { useState, useEffect } from "react";
import { Target, Loader2 } from "lucide-react";
import MissionCard from "./MissionCard";

interface Mission {
  id: string;
  name: string;
  description: string | null;
  type: string;
  xpReward: number;
  progress?: number;
  completed?: boolean;
}

interface MissionListProps {
  showHeader?: boolean;
}

export default function MissionList({ showHeader = true }: MissionListProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<Record<string, { progress: number; completed: boolean }>>({});
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
      setMissions(missionsData.missions || []);

      if (userMissionsRes?.ok) {
        const userData = await userMissionsRes.json();
        const progressMap: Record<string, { progress: number; completed: boolean }> = {};

        [...(userData.dailyMissions || []), ...(userData.weeklyMissions || [])].forEach((m: Mission) => {
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

  // Filter only non-achievement missions
  const missionList = missions.filter(m => m.type !== 'achievement');

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
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">任务列表</h2>
        </div>
      )}

      {missionList.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">暂无任务</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missionList.map((mission) => {
            const userProgress = userMissions[mission.id];
            return (
              <MissionCard
                key={mission.id}
                id={mission.id}
                name={mission.name}
                description={mission.description}
                type={mission.type}
                xpReward={mission.xpReward}
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
