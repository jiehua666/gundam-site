"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import { Search, TrendingUp, Users, Star, ChevronRight, Trophy, Flame, Folder } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";

interface Banner {
  id: string;
  imageUrl: string;
  link: string;
  sortOrder: number;
}

interface Mecha {
  id: string;
  name: string;
  series: string;
  grade: string;
  coverImage: string | null;
  summary: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Stats {
  mechaCount: number;
  userCount: number;
  creationCount: number;
  seriesCount: number;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const setUser = useAuthStore((state) => state.setUser);
  const [stats, setStats] = useState<Stats | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hotMechas, setHotMechas] = useState<Mecha[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored && !user) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, [setUser, user]);

  const fetchData = useCallback(async () => {
    try {
      const [bannersRes, statsRes] = await Promise.all([
        fetch(`/api/banners?t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/stats'),
      ]);
      const bannersData = await bannersRes.json();
      const statsData = await statsRes.json();
      setBanners(bannersData.banners || []);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const [debugInfo, setDebugInfo] = useState({ api: 0, state: 0, time: '' });

  useEffect(() => {
    setDebugInfo({
      api: 6,
      state: banners.length,
      time: new Date().toLocaleTimeString()
    });
  }, [banners]);

  return (
    <div className="bg-background min-h-screen">
      <section className="relative pt-16 px-4">
        <div className="max-w-7xl mx-auto">
          <BannerCarousel banners={banners} />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow mb-4">
              GUNDAM SITE
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              机体百科 + 创作者社区
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="glass-card neon-border-hover rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats?.mechaCount ?? '-'}</p>
              <p className="text-sm text-muted-foreground">机体数量</p>
            </div>
            <div className="glass-card neon-border-hover rounded-xl p-6 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats?.creationCount ?? '-'}</p>
              <p className="text-sm text-muted-foreground">作品数量</p>
            </div>
            <div className="glass-card neon-border-hover rounded-xl p-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats?.userCount ?? '-'}</p>
              <p className="text-sm text-muted-foreground">社区用户</p>
            </div>
            <div className="glass-card neon-border-hover rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats?.seriesCount ?? '-'}</p>
              <p className="text-sm text-muted-foreground">系列作品</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Mechas Section */}
      {hotMechas.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Flame className="w-6 h-6 text-primary" />
                热门机体
              </h2>
              <Link href="/mechas" className="text-primary hover:underline flex items-center gap-1 text-sm">
                查看更多 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {hotMechas.slice(0, 5).map((mecha, index) => (
                <Link
                  key={mecha.id}
                  href={`/mechas/${mecha.id}`}
                  className="glass-card neon-border-hover rounded-xl overflow-hidden hover:scale-105 transition-transform"
                >
                  <div className="relative aspect-[4/3]">
                    {mecha.coverImage ? (
                      <Image src={mecha.coverImage} alt={mecha.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary/50">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-foreground text-sm truncate">{mecha.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{mecha.series}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">{mecha.grade}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Folder className="w-6 h-6 text-primary" />
                机体分类
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/mechas?category=${category.id}`}
                  className="glass-card neon-border-hover rounded-xl p-4 text-center hover:scale-105 transition-transform"
                >
                  <h3 className="font-bold text-foreground">{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* User Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {isAuthenticated && user ? (
            <div className="glass-card neon-border rounded-xl p-6 max-w-md mx-auto">
              <p className="text-lg font-medium text-foreground">
                Welcome, {user.nickname}!
              </p>
              <p className="text-sm text-muted-foreground">
                Level {user.level} • {user.role}
              </p>
              <div className="mt-4 flex gap-4">
                <Link
                  href="/settings"
                  className="px-4 py-2 rounded-lg cyber-button text-sm"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                  }}
                  className="px-4 py-2 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 text-sm font-medium transition"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link href="/login" className="px-6 py-3 rounded-lg cyber-button">
                登录
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 font-medium transition"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            探索 Gundam Site
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/mechas"
              className="glass-card neon-border-hover rounded-xl p-8 hover:scale-105 transition-transform"
            >
              <h3 className="text-xl font-bold text-primary neon-glow mb-2">
                机体库
              </h3>
              <p className="text-muted-foreground">
                浏览所有高达机体，查看详细参数和配色方案
              </p>
            </Link>
            <Link
              href="/creations"
              className="glass-card neon-border-hover rounded-xl p-8 hover:scale-105 transition-transform"
            >
              <h3 className="text-xl font-bold text-primary neon-glow mb-2">
                作品区
              </h3>
              <p className="text-muted-foreground">
                欣赏创作者们的精彩作品，发现灵感
              </p>
            </Link>
            <Link
              href="/rankings"
              className="glass-card neon-border-hover rounded-xl p-8 hover:scale-105 transition-transform"
            >
              <h3 className="text-xl font-bold text-primary neon-glow mb-2">
                排行榜
              </h3>
              <p className="text-muted-foreground">
                查看最受欢迎的机体和创作者排名
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
