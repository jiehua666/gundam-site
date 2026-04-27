"use client";

import { useState, useEffect } from "react";
import { Calendar, Gift, Star, Flame, Clock, AlertCircle } from "lucide-react";

interface CheckinData {
  checkedInToday: boolean;
  checkinDates: string[];
  stats: {
    consecutiveDays: number;
    totalDays: number;
    bestConsecutiveDays: number;
  };
  checkinCards: number;
  xpToday: number;
}

interface CheckinCardProps {
  currentUserId?: string;
}

export default function CheckinCard({ currentUserId: propUserId }: CheckinCardProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [data, setData] = useState<CheckinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showUseCardModal, setShowUseCardModal] = useState(false);
  const [selectedMissedDay, setSelectedMissedDay] = useState<number | null>(null);
  const [isUsingCard, setIsUsingCard] = useState(false);

  useEffect(() => {
    // Get current user
    if (propUserId) {
      setCurrentUserId(propUserId);
    } else {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUserId(user.id || null);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [propUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchCheckinData();
    }
  }, [currentUserId, currentMonth]);

  const fetchCheckinData = async () => {
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`/api/checkins?year=${year}&month=${month}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch checkin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (isCheckingIn || data?.checkedInToday) return;

    setIsCheckingIn(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                checkedInToday: true,
                checkinDates: [...prev.checkinDates, result.checkin.date],
                stats: {
                  ...prev.stats,
                  consecutiveDays: result.checkin.consecutiveDays,
                  totalDays: result.checkin.totalDays,
                },
                xpToday: result.checkin.xpEarned,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Failed to check in:", error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleUseCheckinCard = async () => {
    if (!selectedMissedDay || !data || isUsingCard) return;

    setIsUsingCard(true);
    try {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(selectedMissedDay).padStart(2, "0")}`;
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCard: true, date: dateStr }),
      });

      if (res.ok) {
        const result = await res.json();
        // 重新获取数据以更新日历
        await fetchCheckinData();
        setShowUseCardModal(false);
        setSelectedMissedDay(null);
      }
    } catch (error) {
      console.error("Failed to use checkin card:", error);
    } finally {
      setIsUsingCard(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 获取可以补签的日期（过去的未签到日期，不包括今天）
  const getMissedDays = () => {
    if (!data) return [];
    const today = new Date();
    const missedDays: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const notCheckedIn = !data.checkinDates.includes(dateStr);

      if (isPast && notCheckedIn) {
        missedDays.push(day);
      }
    }
    return missedDays;
  };

  if (isLoading) {
    return (
      <div className="glass-card neon-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-primary/20 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-primary/10 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("zh-CN", { month: "long", year: "numeric" });

  // 构建日历数据
  const calendarDays = [];
  // 填充空白
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // 填充日期
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // 检查日期是否已签到
  const isCheckedIn = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return data.checkinDates.includes(dateStr);
  };

  // 检查是否是今天
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    );
  };

  // 检查是否可以补签
  const canUseCard = (day: number) => {
    return data.checkinCards > 0 && getMissedDays().includes(day);
  };

  const missedDays = getMissedDays();

  return (
    <div className="glass-card neon-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">每日签到</h3>
        </div>
        <div className="flex items-center gap-2">
          {missedDays.length > 0 && data.checkinCards > 0 && (
            <button
              onClick={() => setShowUseCardModal(true)}
              className="px-3 py-2 rounded-lg font-medium bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-all flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              使用补签卡
            </button>
          )}
          <button
            onClick={handleCheckin}
            disabled={data.checkedInToday || isCheckingIn}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              data.checkedInToday
                ? "bg-green-500/20 text-green-500 cursor-default"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isCheckingIn
              ? "签到中..."
              : data.checkedInToday
              ? "已签到"
              : "立即签到"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-lg font-bold">{data.stats.consecutiveDays}</span>
          </div>
          <p className="text-xs text-muted-foreground">连续签到</p>
        </div>
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Star className="w-4 h-4" />
            <span className="text-lg font-bold">{data.stats.totalDays}</span>
          </div>
          <p className="text-xs text-muted-foreground">累计签到</p>
        </div>
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-lg font-bold">{data.checkinCards}</span>
          </div>
          <p className="text-xs text-muted-foreground">补签卡</p>
        </div>
      </div>

      {/* XP Preview */}
      {data.checkedInToday ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 text-center">
          <p className="text-green-500 font-medium">
            今日已签到 +{data.xpToday} XP
          </p>
        </div>
      ) : (
        <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
          <p className="text-primary font-medium">
            签到可获得 +{calculateXp(data.stats.consecutiveDays)} XP
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            连续签到天数越高，XP 奖励越多（最高30XP）
          </p>
        </div>
      )}

      {/* Calendar */}
      <div className="border-t border-border pt-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-primary/10 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-medium text-foreground">{monthName}</span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-primary/10 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded text-sm ${
                day === null
                  ? ""
                  : isCheckedIn(day)
                  ? "bg-primary text-white font-medium"
                  : isToday(day)
                  ? "ring-2 ring-primary text-primary font-medium"
                  : "text-foreground/70"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span>已签到</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded ring-2 ring-primary"></div>
          <span>今天</span>
        </div>
      </div>

      {/* Use Card Modal */}
      {showUseCardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 neon-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-lg text-foreground">使用补签卡</h3>
              </div>
              <button
                onClick={() => {
                  setShowUseCardModal(false);
                  setSelectedMissedDay(null);
                }}
                className="p-1 hover:bg-primary/10 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                当前拥有 <span className="text-orange-500 font-bold">{data.checkinCards}</span> 张补签卡
              </p>
              <p className="text-sm text-muted-foreground">
                选择要补签的日期（只能补签过去的日期）：
              </p>
            </div>

            {/* Missed days grid */}
            <div className="grid grid-cols-7 gap-1 mb-4 max-h-40 overflow-y-auto">
              {missedDays.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedMissedDay(day)}
                  className={`aspect-square flex items-center justify-center rounded text-sm transition-all ${
                    selectedMissedDay === day
                      ? "bg-orange-500 text-white"
                      : "bg-primary/10 text-foreground hover:bg-primary/20"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {selectedMissedDay && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-500">
                  确认补签 {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月{selectedMissedDay}日
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUseCardModal(false);
                  setSelectedMissedDay(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium border border-border hover:bg-primary/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUseCheckinCard}
                disabled={!selectedMissedDay || isUsingCard}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUsingCard ? "补签中..." : "确认使用"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateXp(consecutiveDays: number): number {
  return 5 + Math.min(Math.max(0, consecutiveDays - 1), 25) * 2;
}
