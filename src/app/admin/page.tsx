"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Bot,
  Image,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
} from "lucide-react";

interface Stats {
  userCount: number;
  mechaCount: number;
  creationCount: number;
  commentCount: number;
  reportPendingCount: number;
}

interface RecentUser {
  id: string;
  nickname: string | null;
  username: string;
  role: string;
  createdAt: string;
}

interface RecentCreation {
  id: string;
  title: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string | null;
    username: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentCreations, setRecentCreations] = useState<RecentCreation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        setError("无权限访问管理后台");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers);
      setRecentCreations(data.recentCreations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Shield className="w-16 h-16 text-destructive mb-4" />
        <p className="text-destructive text-lg mb-4">{error}</p>
        <Link href="/" className="cyber-button px-6 py-3 rounded-lg">
          返回首页
        </Link>
      </div>
    );
  }

  const statCards = [
    { label: "用户总数", value: stats?.userCount || 0, icon: Users, color: "text-blue-500" },
    { label: "机体数量", value: stats?.mechaCount || 0, icon: Bot, color: "text-green-500" },
    { label: "作品数量", value: stats?.creationCount || 0, icon: Image, color: "text-purple-500" },
    { label: "评论数量", value: stats?.commentCount || 0, icon: MessageSquare, color: "text-orange-500" },
    { label: "待处理举报", value: stats?.reportPendingCount || 0, icon: AlertTriangle, color: "text-red-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                管理后台
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                高达基地管理系统
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition"
            >
              返回首页
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="glass-card neon-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="glass-card neon-border-hover rounded-xl p-4 hover:bg-primary/10 transition"
          >
            <Users className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">用户管理</h3>
            <p className="text-sm text-muted-foreground">管理用户权限</p>
          </Link>
          <Link
            href="/admin/mechas"
            className="glass-card neon-border-hover rounded-xl p-4 hover:bg-primary/10 transition"
          >
            <Bot className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">机体管理</h3>
            <p className="text-sm text-muted-foreground">管理机体数据</p>
          </Link>
          <Link
            href="/admin/contents"
            className="glass-card neon-border-hover rounded-xl p-4 hover:bg-primary/10 transition"
          >
            <Image className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">内容审核</h3>
            <p className="text-sm text-muted-foreground">审核作品/机体</p>
          </Link>
          <Link
            href="/admin/reports"
            className="glass-card neon-border-hover rounded-xl p-4 hover:bg-primary/10 transition"
          >
            <AlertTriangle className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">举报管理</h3>
            <p className="text-sm text-muted-foreground">处理用户举报</p>
          </Link>
          <Link
            href="/admin/settings"
            className="glass-card neon-border-hover rounded-xl p-4 hover:bg-primary/10 transition"
          >
            <Shield className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-medium text-foreground">系统设置</h3>
            <p className="text-sm text-muted-foreground">Banner/公告/分类</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="glass-card neon-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                最新用户
              </h2>
              <Link href="/admin/users" className="text-sm text-primary hover:underline">
                查看全部
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">暂无用户</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-foreground font-medium">{user.nickname || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'admin' || user.role === 'founder' ? 'bg-red-500/20 text-red-500' :
                        user.role === 'creator' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {user.role === 'admin' || user.role === 'founder' ? '管理员' : user.role === 'creator' ? '创作者' : '普通用户'}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Creations */}
          <div className="glass-card neon-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                最新作品
              </h2>
              <Link href="/admin/contents" className="text-sm text-primary hover:underline">
                查看全部
              </Link>
            </div>
            <div className="space-y-3">
              {recentCreations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">暂无作品</p>
              ) : (
                recentCreations.map((creation) => (
                  <div key={creation.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{creation.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by @{creation.author.username}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(creation.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
