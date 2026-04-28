"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, User, Bot, Image as ImageIcon } from "lucide-react";

interface Mecha {
  id: string;
  name: string;
  series: string | null;
  grade: string | null;
  coverImage: string | null;
}

interface Creation {
  id: string;
  title: string;
  coverImage: string | null;
  authorId: string;
  images: { url: string }[];
}

interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  role: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [mechas, setMechas] = useState<Mecha[]>([]);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [searchQuery]);

  const performSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setMechas(data.mechas || []);
      setCreations(data.creations || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Search Header */}
      <section className="py-12 px-4 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-primary neon-glow mb-6 text-center">
            全局搜索
          </h1>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索机体、作品、用户..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-lg"
              autoFocus
            />
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Mechas */}
              {mechas.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    机体 ({mechas.length})
                  </h2>
                  <div className="space-y-3">
                    {mechas.map((mecha) => (
                      <Link
                        key={mecha.id}
                        href={`/mechas/${mecha.id}`}
                        className="glass-card neon-border-hover rounded-xl p-4 flex items-center gap-4 hover:scale-[1.01] transition"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          {mecha.coverImage ? (
                            <img src={mecha.coverImage} alt={mecha.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-xl">🤖</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{mecha.name}</h3>
                          <p className="text-sm text-muted-foreground">{mecha.series} • {mecha.grade}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {users.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" />
                    用户 ({users.length})
                  </h2>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="glass-card neon-border-hover rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <User className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{user.nickname}</h3>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Creations */}
              {creations.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    作品 ({creations.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {creations.map((creation) => (
                      <div
                        key={creation.id}
                        className="glass-card neon-border-hover rounded-xl overflow-hidden hover:scale-105 transition"
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          {creation.images[0]?.url ? (
                            <img src={creation.images[0].url} alt={creation.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-foreground text-sm truncate">{creation.title}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchQuery && mechas.length === 0 && users.length === 0 && creations.length === 0 && (
                <div className="text-center py-20">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">未找到相关结果</p>
                  <p className="text-sm text-muted-foreground mt-2">试试其他关键词</p>
                </div>
              )}

              {/* Initial State */}
              {!searchQuery && (
                <div className="text-center py-20">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">输入关键词开始搜索</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
