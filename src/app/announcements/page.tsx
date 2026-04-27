"use client";

import { useState, useEffect } from "react";
import { Megaphone, Pin } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  isTop: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8" />
            公告
          </h1>
          <p className="text-muted-foreground">
            了解最新动态和重要通知
          </p>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20">
              <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无公告</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`glass-card neon-border-hover rounded-xl p-6 ${
                    ann.isTop ? 'border-primary/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {ann.isTop && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Pin className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">
                        {ann.isTop && <span className="text-primary mr-2">[置顶]</span>}
                        {ann.title}
                      </h3>
                      {ann.content && (
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {ann.publishedAt
                          ? new Date(ann.publishedAt).toLocaleDateString('zh-CN')
                          : new Date(ann.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
