"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Image, Bell, Tag, Layers, Save, Plus, Trash2 } from "lucide-react";

type TabType = "banners" | "announcements" | "categories" | "tags";

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<TabType>("banners");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // New item states
  const [newBanner, setNewBanner] = useState({ title: "", image: "", link: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", isPinned: false });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (tab === "banners") {
        const res = await fetch("/api/admin/settings/banners");
        if (res.ok) {
          const data = await res.json();
          setBanners(data.items || []);
        }
      } else if (tab === "announcements") {
        const res = await fetch("/api/admin/settings/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.items || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!newBanner.title || !newBanner.image) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin/settings/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBanner),
      });
      if (res.ok) {
        setNewBanner({ title: "", image: "", link: "" });
        fetchData();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveStatus("idle");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("确定删除？")) return;
    try {
      await fetch(`/api/admin/settings/banners/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin/settings/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
      });
      if (res.ok) {
        setNewAnnouncement({ title: "", content: "", isPinned: false });
        fetchData();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回管理后台
          </Link>
          <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
          <p className="text-muted-foreground text-sm mt-1">管理 Banner、公告、分类、标签</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: "banners", label: "Banner", icon: Image },
            { key: "announcements", label: "公告", icon: Bell },
            { key: "categories", label: "分类", icon: Layers },
            { key: "tags", label: "标签", icon: Tag },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                  tab === item.key
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="glass-card neon-border rounded-xl p-6">
              {tab === "banners" && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">Banner 列表</h2>
                  {banners.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">暂无 Banner</p>
                  ) : (
                    <div className="space-y-3">
                      {banners.map((banner) => (
                        <div key={banner.id} className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border">
                          <div className="w-24 h-16 rounded overflow-hidden bg-primary/20 flex-shrink-0">
                            {banner.image ? (
                              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium truncate">{banner.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{banner.link || "无链接"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              banner.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                            }`}>
                              {banner.isActive ? "启用" : "禁用"}
                            </span>
                            <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === "announcements" && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">公告列表</h2>
                  {announcements.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">暂无公告</p>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((ann) => (
                        <div key={ann.id} className="p-4 bg-card rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-foreground font-medium">{ann.title}</p>
                              {ann.isPinned && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">置顶</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ann.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {(tab === "categories" || tab === "tags") && (
                <div className="text-center py-20 text-muted-foreground">
                  {tab === "categories" ? "分类" : "标签"}管理开发中...
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Add New */}
          <div className="lg:col-span-1">
            <div className="glass-card neon-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">添加新内容</h3>

              {tab === "banners" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">标题</label>
                    <input
                      type="text"
                      value={newBanner.title}
                      onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary"
                      placeholder="Banner 标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">图片 URL</label>
                    <input
                      type="text"
                      value={newBanner.image}
                      onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">链接 (可选)</label>
                    <input
                      type="text"
                      value={newBanner.link}
                      onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    onClick={handleSaveBanner}
                    disabled={!newBanner.title || !newBanner.image || saveStatus === "saving"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    {saveStatus === "saving" ? "保存中..." : "添加 Banner"}
                  </button>
                </div>
              )}

              {tab === "announcements" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">标题</label>
                    <input
                      type="text"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary"
                      placeholder="公告标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">内容</label>
                    <textarea
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary resize-none"
                      rows={4}
                      placeholder="公告内容..."
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.isPinned}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">置顶公告</span>
                  </label>
                  <button
                    onClick={handleSaveAnnouncement}
                    disabled={!newAnnouncement.title || !newAnnouncement.content || saveStatus === "saving"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    {saveStatus === "saving" ? "保存中..." : "发布公告"}
                  </button>
                </div>
              )}

              {(tab === "categories" || tab === "tags") && (
                <p className="text-muted-foreground text-center">
                  {tab === "categories" ? "分类" : "标签"}管理开发中...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
