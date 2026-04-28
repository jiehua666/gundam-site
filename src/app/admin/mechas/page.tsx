"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Search, Edit, Trash2, Plus, Eye } from "lucide-react";

interface Mecha {
  id: string;
  name: string;
  series: string | null;
  grade: string | null;
  classification: string | null;
  coverImage: string | null;
  summary: string | null;
  createdAt: string;
  status: string;
}

export default function AdminMechasPage() {
  const [mechas, setMechas] = useState<Mecha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, pending

  useEffect(() => {
    fetchMechas();
  }, [filter]);

  const fetchMechas = async () => {
    setIsLoading(true);
    try {
      // 获取所有机体（包括非 active 状态的）
      const res = await fetch(`/api/mechas?status=${filter}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMechas(data.mechas || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个机体？")) return;
    try {
      const res = await fetch(`/api/mechas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMechas();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredMechas = mechas.filter((mecha) =>
    !search ||
    mecha.name.toLowerCase().includes(search.toLowerCase()) ||
    (mecha.series && mecha.series.toLowerCase().includes(search.toLowerCase()))
  );

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">机体管理</h1>
              <p className="text-muted-foreground text-sm mt-1">管理系统中的机体数据</p>
            </div>
            <Link
              href="/admin/mechas/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" />
              添加机体
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索机体名称或系列..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "active", label: "已发布" },
              { key: "pending", label: "待审核" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === item.key
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="glass-card neon-border rounded-xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMechas.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">暂有机体</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMechas.map((mecha) => (
                <div key={mecha.id} className="p-4 flex items-center gap-4">
                  {/* Cover */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {mecha.coverImage ? (
                      <img src={mecha.coverImage} alt={mecha.name} className="w-full h-full object-cover" />
                    ) : (
                      <Bot className="w-8 h-8 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">{mecha.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {mecha.series || "未分类"} • {mecha.grade || "无等级"} • {mecha.classification || "无分类"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(mecha.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`text-xs px-2 py-1 rounded ${
                    mecha.status === 'active' ? 'bg-green-500/20 text-green-500' :
                    mecha.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {mecha.status === 'active' ? '已发布' : mecha.status === 'pending' ? '待审核' : '已拒绝'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/mechas/${mecha.id}`}
                      className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/mechas/${mecha.id}/edit`}
                      className="p-2 rounded-lg hover:bg-blue-500/20 text-muted-foreground hover:text-blue-500 transition"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(mecha.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
