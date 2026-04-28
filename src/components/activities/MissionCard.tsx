"use client";

import { useRouter } from "next/navigation";
import { Calendar, Gift, Trophy, Clock, CheckCircle } from "lucide-react";

interface MissionCardProps {
  id: string;
  name: string;
  description: string | null;
  type: string;
  xpReward: number;
  progress?: number;
  completed?: boolean;
}

export default function MissionCard({
  id,
  name,
  description,
  type,
  xpReward,
  progress = 0,
  completed = false,
}: MissionCardProps) {
  const router = useRouter();

  const getIcon = () => {
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

  const getTypeName = () => {
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

  const getButtonText = () => {
    switch (name) {
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

  const handleAction = () => {
    switch (name) {
      case '每日签到':
        router.push('/activities?section=checkin');
        break;
      case '每日登录':
        router.push('/');
        break;
      case '首次评论':
        router.push('/creations');
        break;
      case '首次作品':
        router.push('/creations/new');
        break;
      case '完善资料':
        router.push('/settings');
        break;
      case '获得10赞':
        router.push('/creations');
        break;
      case '关注5人':
        router.push('/rankings');
        break;
      case '评论10次':
        router.push('/creations');
        break;
      default:
        console.log('Unknown mission:', name);
    }
  };

  return (
    <div className="glass-card neon-border-hover rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          completed ? "bg-green-500/20" : "bg-primary/20"
        }`}>
          {completed ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            getIcon()
          )}
        </div>
        <div>
          <h3 className="font-bold text-foreground">{name}</h3>
          <span className="text-xs text-primary">{getTypeName()}</span>
        </div>
      </div>

      {description && (
        <p className="text-muted-foreground text-sm mb-4">
          {description}
        </p>
      )}

      {/* Progress Bar */}
      {type === 'progress' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>进度</span>
            <span>{progress} / 1</span>
          </div>
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((progress / 1) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-accent">+{xpReward} XP</span>
        {completed ? (
          <span className="px-4 py-2 rounded-lg bg-green-500/20 text-green-500 text-sm font-medium">
            已完成
          </span>
        ) : (
          <button
            onClick={handleAction}
            className="px-4 py-2 rounded-lg cyber-button text-sm"
          >
            {getButtonText()}
          </button>
        )}
      </div>
    </div>
  );
}
