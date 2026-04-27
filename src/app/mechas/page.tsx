"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Grid, List, ChevronDown } from "lucide-react";

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
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MechasPage() {
  const [mechas, setMechas] = useState<Mecha[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [series, setSeries] = useState("");
  const [grade, setGrade] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchMechas();
  }, [series, grade]);

  const fetchMechas = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (series) params.set("series", series);
      if (grade) params.set("grade", grade);

      const res = await fetch(`/api/mechas?${params}`);
      const data = await res.json();
      setMechas(data.mechas);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch mechas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMechas();
  };

  const uniqueSeries = [...new Set(mechas.map((m) => m.series).filter(Boolean))];
  const uniqueGrades = [...new Set(mechas.map((m) => m.grade).filter(Boolean))];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-4">
            机体库
          </h1>
          <p className="text-muted-foreground">
            浏览所有高达机体，查看详细参数和配色方案
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 px-4 border-t border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索机体..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </form>

            {/* Filter Dropdowns */}
            <div className="flex gap-3">
              <select
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">全部系列</option>
                {uniqueSeries.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">全部等级</option>
                {uniqueGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mecha Grid/List */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : mechas.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">没有找到匹配的机体</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mechas.map((mecha) => (
                <Link
                  key={mecha.id}
                  href={`/mechas/${mecha.id}`}
                  className="glass-card neon-border-hover rounded-xl overflow-hidden hover:scale-105 transition-transform"
                >
                  {/* Cover Image Placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    {mecha.coverImage ? (
                      <img
                        src={mecha.coverImage}
                        alt={mecha.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">🤖</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground mb-1 truncate">
                      {mecha.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {mecha.series} • {mecha.grade}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {mecha.summary || "暂无描述"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {mecha.grade && (
                        <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">
                          {mecha.grade}
                        </span>
                      )}
                      {mecha.classification && (
                        <span className="px-2 py-1 text-xs rounded bg-accent/20 text-accent">
                          {mecha.classification}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mechas.map((mecha) => (
                <Link
                  key={mecha.id}
                  href={`/mechas/${mecha.id}`}
                  className="glass-card neon-border-hover rounded-xl p-4 flex gap-4 hover:scale-[1.02] transition-transform"
                >
                  {/* Cover Image Placeholder */}
                  <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    {mecha.coverImage ? (
                      <img
                        src={mecha.coverImage}
                        alt={mecha.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">🤖</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground mb-1">
                      {mecha.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {mecha.series} • {mecha.grade} • {mecha.classification}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {mecha.summary || "暂无描述"}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex gap-2">
                      {mecha.grade && (
                        <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">
                          {mecha.grade}
                        </span>
                      )}
                    </div>
                    {mecha.height && (
                      <p className="text-xs text-muted-foreground mt-2">
                        身高: {mecha.height}
                      </p>
                    )}
                    {mecha.weight && (
                      <p className="text-xs text-muted-foreground">
                        重量: {mecha.weight}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => fetchMechas(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === pagination.page
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-card text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
