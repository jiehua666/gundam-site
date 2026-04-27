"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, MessageSquare, Heart, Eye, Star, Users, FileText, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  role: string;
  level: number;
  totalXp: number;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  creationsCount: number;
  userStats?: {
    checkinDays: number;
    consecutiveDays: number;
    bestConsecutiveDays: number;
    creationCount: number;
    commentCount: number;
    likedCount: number;
    followerCount: number;
  };
}

interface Creation {
  id: string;
  title: string;
  authorId: string;
  likeCount: number;
  viewCount: number;
  collectCount: number;
  createdAt: string;
  images: { url: string }[];
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string | null;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"creations" | "about">("creations");

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchCreations();
    }
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreations = async () => {
    try {
      const res = await fetch(`/api/creations?authorId=${userId}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setCreations(data.creations || []);
      }
    } catch (error) {
      console.error("Failed to fetch creations:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLevelColor = (level: number) => {
    if (level >= 25) return 'text-orange-500';
    if (level >= 20) return 'text-purple-500';
    if (level >= 15) return 'text-blue-500';
    if (level >= 10) return 'text-green-500';
    return 'text-primary';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">用户不存在</h1>
        <Link href="/" className="text-primary hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20" />
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>

        <div className="glass-card neon-border rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 p-1">
                <div className="w-full h-full rounded-lg bg-card flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.nickname}
                      width={120}
                      height={120}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{user.nickname?.[0] || 'U'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{user.nickname}</h1>
                {user.role === 'founder' && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                    创始人
                  </span>
                )}
                {user.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded-full">
                    管理员
                  </span>
                )}
                {user.role === 'creator' && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 text-xs rounded-full">
                    创作者
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-4">@{user.username}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getLevelColor(user.level)}`}>
                    Lv.{user.level}
                  </div>
                  <div className="text-xs text-muted-foreground">等级</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {user.followerCount}
                  </div>
                  <div className="text-xs text-muted-foreground">粉丝</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {user.followingCount}
                  </div>
                  <div className="text-xs text-muted-foreground">关注</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {user.creationsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">作品</div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">经验值</span>
                  <span className="text-primary font-medium">{user.totalXp} XP</span>
                </div>
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{ width: `${Math.min((user.totalXp / 60000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <Link
                    href="/settings"
                    className="px-4 py-2 rounded-lg cyber-button text-sm"
                  >
                    编辑资料
                  </Link>
                ) : isAuthenticated ? (
                  <button className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm">
                    关注
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm"
                  >
                    登录后关注
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab("creations")}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === "creations"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            作品 {user.creationsCount}
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === "about"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            关于
          </button>
        </div>

        {/* Content */}
        <div className="py-6">
          {activeTab === "creations" && (
            <>
              {creations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">暂无作品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creations.map((creation) => (
                    <Link
                      key={creation.id}
                      href={`/creations/${creation.id}`}
                      className="glass-card neon-border-hover rounded-xl overflow-hidden hover:scale-[1.02] transition"
                    >
                      {/* Cover Image */}
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        {creation.images[0]?.url ? (
                          <img
                            src={creation.images[0].url}
                            alt={creation.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {creation.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {creation.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {creation.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            0
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "about" && (
            <div className="glass-card neon-border rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">加入时间</div>
                    <div className="text-foreground">{formatDate(user.createdAt)}</div>
                  </div>
                </div>

                {user.userStats && (
                  <>
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">签到</div>
                        <div className="text-foreground">
                          累计 {user.userStats.checkinDays} 天，连续 {user.userStats.consecutiveDays} 天
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">获得赞</div>
                        <div className="text-foreground">{user.userStats.likedCount} 次</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">发表评论</div>
                        <div className="text-foreground">{user.userStats.commentCount} 条</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">粉丝</div>
                        <div className="text-foreground">
                          {user.userStats.followerCount} 人
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
