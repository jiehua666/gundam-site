"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, Plus } from "lucide-react";

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

export default function CreationsPage() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreations();
  }, []);

  const fetchCreations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/creations?limit=20');
      const data = await res.json();
      setCreations(data.creations || []);
    } catch (error) {
      console.error("Failed to fetch creations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
                作品区
              </h1>
              <p className="text-muted-foreground">
                欣赏创作者们的精彩作品
              </p>
            </div>
            <Link
              href="/creations/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg cyber-button"
            >
              <Plus className="w-5 h-5" />
              发布作品
            </Link>
          </div>
        </div>
      </section>

      {/* Creations Grid - Waterfall Layout */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : creations.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎨</span>
              </div>
              <p className="text-muted-foreground mb-4">暂无作品</p>
              <Link href="/creations/new" className="cyber-button px-6 py-3 rounded-lg">
                成为第一个创作者
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {creations.map((creation) => (
                <Link
                  key={creation.id}
                  href={`/creations/${creation.id}`}
                  className="glass-card neon-border-hover rounded-xl overflow-hidden block hover:scale-[1.02] transition-transform duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    {creation.images[0]?.url ? (
                      <Image
                        src={creation.images[0].url}
                        alt={creation.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">🎨</span>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground mb-2 line-clamp-2 text-base">
                      {creation.title}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {creation.author.avatar ? (
                          <Image
                            src={creation.author.avatar}
                            alt={creation.author.nickname}
                            width={24}
                            height={24}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs text-primary font-bold">
                            {creation.author.nickname?.[0] || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {creation.author.nickname}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-primary" />
                        {creation.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {creation.viewCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}