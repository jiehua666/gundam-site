"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, Bookmark, Share2, Eye, Calendar } from "lucide-react";
import CommentsSection from "@/components/creations/CommentsSection";

interface CreationImage {
  id: string;
  url: string;
  type: string;
  width: number | null;
  height: number | null;
}

interface Author {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  level: number;
}

interface Mecha {
  id: string;
  name: string;
  series: string;
  grade: string;
  coverImage: string | null;
}

interface Creation {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  tags: string | null;
  copyrightType: string;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  createdAt: string;
  images: CreationImage[];
  author: Author;
  mecha: Mecha | null;
}

export default function CreationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [creation, setCreation] = useState<Creation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localCollectCount, setLocalCollectCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user from auth store
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.userId || user.id || null);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCreation();
    }
  }, [id]);

  const fetchCreation = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/creations/${id}`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error("Creation not found");
      }
      const data = await res.json();
      setCreation(data.creation);
      setLocalLikeCount(data.creation.likeCount);
      setLocalCollectCount(data.creation.collectCount);

      // Check like/collect status
      const [likeRes, collectRes] = await Promise.all([
        fetch(`/api/likes?targetType=creation&targetId=${id}`),
        fetch(`/api/collects?targetType=creation&targetId=${id}`),
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
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        const res = await fetch(`/api/likes?targetType=creation&targetId=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setIsLiked(false);
          setLocalLikeCount((c) => c - 1);
        } else {
          const data = await res.json();
          console.error('Unlike failed:', data.error);
        }
      } else {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'creation', targetId: id }),
        });
        if (res.ok) {
          setIsLiked(true);
          setLocalLikeCount((c) => c + 1);
        } else {
          const data = await res.json();
          console.error('Like failed:', data.error);
        }
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const toggleCollect = async () => {
    try {
      if (isCollected) {
        const res = await fetch(`/api/collects?targetType=creation&targetId=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setIsCollected(false);
          setLocalCollectCount((c) => c - 1);
        } else {
          const data = await res.json();
          console.error('Uncollect failed:', data.error);
        }
      } else {
        const res = await fetch('/api/collects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'creation', targetId: id }),
        });
        if (res.ok) {
          setIsCollected(true);
          setLocalCollectCount((c) => c + 1);
        } else {
          const data = await res.json();
          console.error('Collect failed:', data.error);
        }
      }
    } catch (err) {
      console.error('Failed to toggle collect:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !creation) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center">
        <p className="text-destructive text-lg mb-4">{error || "Not found"}</p>
        <Link href="/creations" className="cyber-button px-6 py-3 rounded-lg">
          返回作品区
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="py-8 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/creations"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作品区
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {creation.title}
              </h1>

              {/* Author Info */}
              <Link
                href={`/users/${creation.author.id}`}
                className="flex items-center gap-3 mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {creation.author.avatar ? (
                    <Image
                      src={creation.author.avatar}
                      alt={creation.author.nickname}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-lg text-primary">
                      {creation.author.nickname?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {creation.author.nickname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lv.{creation.author.level}
                  </p>
                </div>
              </Link>

              {/* Related Mecha */}
              {creation.mecha && (
                <Link
                  href={`/mechas/${creation.mecha.id}`}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm hover:bg-primary/30 transition"
                >
                  🤖 {creation.mecha.name}
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isLiked
                    ? 'bg-primary text-white'
                    : 'border border-primary/30 text-foreground hover:bg-primary/10'
                } transition`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                {localLikeCount}
              </button>
              <button
                onClick={toggleCollect}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isCollected
                    ? 'bg-primary text-white'
                    : 'border border-primary/30 text-foreground hover:bg-primary/10'
                } transition`}
              >
                <Bookmark className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
                {localCollectCount}
              </button>
              <button className="px-4 py-2 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery & Content */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Gallery */}
            <div className="lg:col-span-2">
              {/* Main Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                {creation.images[selectedImage]?.url ? (
                  <Image
                    src={creation.images[selectedImage].url}
                    alt={creation.title}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🎨</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {creation.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {creation.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                        idx === selectedImage
                          ? 'ring-2 ring-primary'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Stats */}
              <div className="glass-card neon-border rounded-xl p-6 mb-4">
                <h3 className="font-bold text-foreground mb-4">统计数据</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4" /> 阅读
                    </span>
                    <span className="text-foreground font-medium">
                      {creation.viewCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4" /> 点赞
                    </span>
                    <span className="text-foreground font-medium">
                      {creation.likeCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Bookmark className="w-4 h-4" /> 收藏
                    </span>
                    <span className="text-foreground font-medium">
                      {creation.collectCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              {creation.content && (
                <div className="glass-card neon-border rounded-xl p-6 mb-4">
                  <h3 className="font-bold text-foreground mb-4">作品描述</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {creation.content}
                  </p>
                </div>
              )}

              {/* Tags */}
              {creation.tags && (
                <div className="glass-card neon-border rounded-xl p-6 mb-4">
                  <h3 className="font-bold text-foreground mb-4">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {creation.tags.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="glass-card neon-border rounded-xl p-6">
                <h3 className="font-bold text-foreground mb-4">发布时间</h3>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(creation.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <CommentsSection
              targetType="creation"
              targetId={creation.id}
              currentUserId={currentUserId || undefined}
            />
          </div>
        </div>
      </section>
    </div>
  );
}