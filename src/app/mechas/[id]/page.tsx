"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Share2, Bookmark, ChevronRight, Edit } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface MechaSpec {
  id: string;
  specKey: string;
  specValue: string;
}

interface Palette {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  image: string | null;
}

interface Mecha {
  id: string;
  name: string;
  series: string | null;
  grade: string | null;
  classification: string | null;
  coverImage: string | null;
  summary: string | null;
  height: string | null;
  weight: string | null;
  powerSystem: string | null;
  armor: string | null;
  contentSource: string;
  createdAt: string;
  likeCount: number;
  collectCount: number;
  specs: MechaSpec[];
  palettes: Palette[];
}

export default function MechaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const id = params.id as string;
  const [mecha, setMecha] = useState<Mecha | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localCollectCount, setLocalCollectCount] = useState(0);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'founder';

  useEffect(() => {
    fetchMecha();
  }, [id]);

  useEffect(() => {
    if (mecha) {
      setLocalLikeCount(mecha.likeCount);
      setLocalCollectCount(mecha.collectCount);
      checkLikeCollectStatus();
    }
  }, [mecha]);

  const checkLikeCollectStatus = async () => {
    try {
      const [likeRes, collectRes] = await Promise.all([
        fetch(`/api/likes?targetType=mecha&targetId=${id}`),
        fetch(`/api/collects?targetType=mecha&targetId=${id}`),
      ]);
      if (likeRes.ok) {
        const likeData = await likeRes.json();
        setIsLiked(likeData.liked);
      }
      if (collectRes.ok) {
        const collectData = await collectRes.json();
        setIsCollected(collectData.collected);
      }
    } catch (err) {
      console.error('Failed to check like/collect status:', err);
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        const res = await fetch(`/api/likes?targetType=mecha&targetId=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setIsLiked(false);
          setLocalLikeCount((c) => c - 1);
        }
      } else {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'mecha', targetId: id }),
        });
        if (res.ok) {
          setIsLiked(true);
          setLocalLikeCount((c) => c + 1);
          setLikeAnimation(true);
          setTimeout(() => setLikeAnimation(false), 600);
        }
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const toggleCollect = async () => {
    try {
      if (isCollected) {
        const res = await fetch(`/api/collects?targetType=mecha&targetId=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setIsCollected(false);
          setLocalCollectCount((c) => c - 1);
        }
      } else {
        const res = await fetch('/api/collects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'mecha', targetId: id }),
        });
        if (res.ok) {
          setIsCollected(true);
          setLocalCollectCount((c) => c + 1);
        }
      }
    } catch (err) {
      console.error('Failed to toggle collect:', err);
    }
  };

  const fetchMecha = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/mechas/${id}`);
      if (!res.ok) {
        throw new Error("Mecha not found");
      }
      const data = await res.json();
      setMecha(data.mecha);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mecha");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !mecha) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center">
        <p className="text-destructive text-lg mb-4">{error || "Mecha not found"}</p>
        <Link href="/mechas" className="cyber-button px-6 py-3 rounded-lg">
          返回机体库
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/mechas"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回机体库
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cover Image */}
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden neon-border relative">
              {mecha.coverImage ? (
                <img
                  src={mecha.coverImage}
                  alt={mecha.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-8xl">🤖</span>
              )}
              {/* 3D Model Placeholder Overlay */}
              <div className="absolute bottom-3 right-3">
                <div className="glass-card neon-border px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-lg">🎮</span>
                  <span>3D 模型预留入口</span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-foreground">{mecha.name}</h1>
                <div className="flex gap-2">
                  {mecha.grade && (
                    <span className="px-3 py-1 text-sm rounded-full bg-primary/20 text-primary border border-primary/30">
                      {mecha.grade}
                    </span>
                  )}
                  {mecha.classification && (
                    <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent border border-accent/30">
                      {mecha.classification}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mb-6">{mecha.summary}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {mecha.height && (
                  <div className="glass-card neon-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">身高</p>
                    <p className="text-xl font-bold text-foreground">{mecha.height}</p>
                  </div>
                )}
                {mecha.weight && (
                  <div className="glass-card neon-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">重量</p>
                    <p className="text-xl font-bold text-foreground">{mecha.weight}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={toggleLike}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition ${
                    isLiked
                      ? 'bg-primary text-white'
                      : 'border border-primary/30 text-foreground hover:bg-primary/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${likeAnimation ? 'animate-like-burst' : ''}`} />
                  喜欢 {localLikeCount}
                </button>
                <button
                  onClick={toggleCollect}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition ${
                    isCollected
                      ? 'bg-primary text-white'
                      : 'border border-primary/30 text-foreground hover:bg-primary/10'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
                  收藏 {localCollectCount}
                </button>
                <button className="px-6 py-3 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition">
                  <Share2 className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <Link
                    href={`/mechas/${id}/edit`}
                    className="px-6 py-3 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition flex items-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    编辑
                  </Link>
                )}
              </div>

              {/* 3D Model Section Placeholder */}
              <div className="mt-6 glass-card neon-border rounded-xl p-6 border-dashed border-2 border-primary/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <span className="text-xl">🎮</span>
                    3D 模型
                  </h3>
                  <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">预留入口</span>
                </div>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    3D 模型功能开发中<br />
                    <span className="text-xs">敬请期待</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Specifications */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-foreground mb-4">基本参数</h2>
              <div className="glass-card neon-border rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">系列</span>
                    <span className="text-foreground font-medium">{mecha.series || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">等级</span>
                    <span className="text-foreground font-medium">{mecha.grade || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">分类</span>
                    <span className="text-foreground font-medium">{mecha.classification || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">动力系统</span>
                    <span className="text-foreground font-medium">{mecha.powerSystem || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">装甲材质</span>
                    <span className="text-foreground font-medium">{mecha.armor || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">身高</span>
                    <span className="text-foreground font-medium">{mecha.height || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">重量</span>
                    <span className="text-foreground font-medium">{mecha.weight || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">数据来源</span>
                    <span className="text-foreground font-medium">{mecha.contentSource}</span>
                  </div>
                </div>
              </div>

              {/* Custom Specs */}
              {mecha.specs.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">详细参数</h2>
                  <div className="glass-card neon-border rounded-xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mecha.specs.map((spec) => (
                        <div key={spec.id} className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">{spec.specKey}</span>
                          <span className="text-foreground font-medium">{spec.specValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Color Palettes */}
              <h2 className="text-xl font-bold text-foreground mb-4">配色方案</h2>
              {mecha.palettes.length > 0 ? (
                <div className="space-y-3">
                  {mecha.palettes.map((palette) => (
                    <div key={palette.id} className="glass-card neon-border rounded-xl p-4">
                      <h3 className="font-medium text-foreground mb-3">{palette.name}</h3>
                      <div className="flex gap-2">
                        {palette.primaryColor && (
                          <div
                            className="w-8 h-8 rounded-full border border-border"
                            style={{ backgroundColor: palette.primaryColor }}
                            title={`Primary: ${palette.primaryColor}`}
                          />
                        )}
                        {palette.secondaryColor && (
                          <div
                            className="w-8 h-8 rounded-full border border-border"
                            style={{ backgroundColor: palette.secondaryColor }}
                            title={`Secondary: ${palette.secondaryColor}`}
                          />
                        )}
                        {palette.accentColor && (
                          <div
                            className="w-8 h-8 rounded-full border border-border"
                            style={{ backgroundColor: palette.accentColor }}
                            title={`Accent: ${palette.accentColor}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card neon-border rounded-xl p-6 text-center">
                  <p className="text-muted-foreground">暂无配色方案</p>
                </div>
              )}

              {/* Related Actions */}
              <div className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-4">相关操作</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between px-4 py-3 glass-card neon-border-hover rounded-lg hover:bg-primary/10 transition">
                    <span className="text-foreground">查看相关作品</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 glass-card neon-border-hover rounded-lg hover:bg-primary/10 transition">
                    <span className="text-foreground">查看评论</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 glass-card neon-border-hover rounded-lg hover:bg-primary/10 transition">
                    <span className="text-foreground">历史版本</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
