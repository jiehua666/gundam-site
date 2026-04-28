"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Image, Search, Filter, Check, X, Eye } from "lucide-react";

type TabType = "creations" | "mechas";

interface Creation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  author: { id: string; nickname: string | null; username: string };
}

interface Mecha {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function AdminContentsPage() {
  const [tab, setTab] = useState<TabType>("creations");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [mechas, setMechas] = useState<Mecha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // pending, approved, rejected, all

  useEffect(() => {
    fetchData();
  }, [tab, filter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (tab === "creations") {
        const res = await fetch(`/api/admin/contents?type=creations&status=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setCreations(data.items || []);
        }
      } else {
        const res = await fetch(`/api/admin/contents?type=mechas&status=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setMechas(data.items || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/contents/${id}?action=${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab === 'creations' ? 'creation' : 'mecha' }),
      });
      if (res.ok) {
        fetchData(); // Refresh
      }
    } catch (err) {
      console.error('Action failed:', err);
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
          <h1 className="text-2xl font-bold text-foreground">内容审核</h1>
          <p className="text-muted-foreground text-sm mt-1">审核作品和机体</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("creations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              tab === "creations"
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Image className="w-4 h-4" />
            作品
          </button>
          <button
            onClick={() => setTab("mechas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              tab === "mechas"
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="w-4 h-4" />
            机体
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-4 mb-6">
          {[
            { key: "all", label: "全部" },
            { key: "pending", label: "待审核" },
            { key: "active", label: "已通过" },
            { key: "rejected", label: "已拒绝" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filter === item.key
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="glass-card neon-border rounded-xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : tab === "creations" ? (
            creations.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">暂无作品</div>
            ) : (
              <div className="divide-y divide-border">
                {creations.map((creation) => (
                  <div key={creation.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{creation.title}</p>
                      <p className="text-sm text-muted-foreground">
                        @{creation.author.username} • {new Date(creation.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        creation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        creation.status === 'active' || creation.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {creation.status === 'pending' ? '待审核' :
                         creation.status === 'active' || creation.status === 'approved' ? '已通过' : '已拒绝'}
                      </span>
                      {creation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(creation.id, "approve")}
                            className="p-2 rounded-lg hover:bg-green-500/20 text-green-500 transition"
                            title="通过"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(creation.id, "reject")}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition"
                            title="拒绝"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/creations/${creation.id}`}
                        className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground transition"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : mechas.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">暂有机体</div>
          ) : (
            <div className="divide-y divide-border">
              {mechas.map((mecha) => (
                <div key={mecha.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{mecha.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(mecha.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      mecha.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      mecha.status === 'active' || mecha.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {mecha.status === 'pending' ? '待审核' :
                       mecha.status === 'active' || mecha.status === 'approved' ? '已通过' : '已拒绝'}
                    </span>
                    {mecha.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(mecha.id, "approve")}
                          className="p-2 rounded-lg hover:bg-green-500/20 text-green-500 transition"
                          title="通过"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(mecha.id, "reject")}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition"
                          title="拒绝"
                        >
                          <X className="w-4" />
                        </button>
                      </>
                    )}
                    <Link
                      href={`/mechas/${mecha.id}`}
                      className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground transition"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
