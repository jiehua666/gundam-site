"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Star, Users, Crown } from "lucide-react";

interface Mecha {
  id: string;
  name: string;
  series: string | null;
  grade: string | null;
  coverImage: string | null;
}

interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  level: number;
  totalXp?: number;
}

export default function RankingsPage() {
  const [mechas, setMechas] = useState<Mecha[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      const [mechasRes, usersRes] = await Promise.all([
        fetch('/api/mechas?limit=10'),
        fetch('/api/users?limit=10'),
      ]);
      const mechasData = await mechasRes.json();
      const usersData = await usersRes.json();
      setMechas(mechasData.mechas || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error("Failed to fetch rankings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
            排行榜
          </h1>
          <p className="text-muted-foreground">
            查看最受欢迎的机体和活跃用户
          </p>
        </div>
      </section>

      {/* Rankings */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mecha Rankings */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  机体热度榜
                </h2>
                <div className="space-y-3">
                  {mechas.map((mecha, index) => (
                    <Link
                      key={mecha.id}
                      href={`/mechas/${mecha.id}`}
                      className="glass-card neon-border-hover rounded-xl p-4 flex items-center gap-4 hover:scale-[1.02] transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </span>
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {mecha.coverImage ? (
                          <img src={mecha.coverImage} alt={mecha.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-xl">🤖</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{mecha.name}</h3>
                        <p className="text-sm text-muted-foreground">{mecha.series} • {mecha.grade}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* User Rankings */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-accent" />
                  活跃用户榜
                </h2>
                <div className="space-y-3">
                  {users.map((user, index) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.id}`}
                      className="glass-card neon-border-hover rounded-xl p-4 flex items-center gap-4 hover:scale-[1.02] transition"
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {index < 3 ? <Crown className="w-4 h-4" /> : index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <Image src={user.avatar} alt={user.nickname} width={40} height={40} className="object-cover" />
                        ) : (
                          <span className="text-lg">{user.nickname?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{user.nickname}</h3>
                        <p className="text-sm text-muted-foreground">Lv.{user.level}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
