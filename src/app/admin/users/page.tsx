"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Shield, UserX, Check, X } from "lucide-react";

interface User {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
  role: string;
  status: string;
  createdAt: string;
  userStats: {
    creationCount: number;
    commentCount: number;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, admin, creator, user

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleBan = async (userId: string, ban: boolean) => {
    if (!confirm(ban ? '确定封禁该用户？' : '确定解封该用户？')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: ban }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update ban status:', err);
    }
  };

  const filteredUsers = users.filter((user) =>
    !search ||
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    (user.nickname && user.nickname.toLowerCase().includes(search.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-foreground">用户管理</h1>
          <p className="text-muted-foreground text-sm mt-1">管理用户权限和状态</p>
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
              placeholder="搜索用户名或昵称..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "founder", label: "创始人" },
              { key: "admin", label: "管理员" },
              { key: "creator", label: "创作者" },
              { key: "user", label: "普通用户" },
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">暂无用户</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.nickname || user.username} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{user.nickname || user.username}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Role Badge */}
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin' || user.role === 'founder' ? 'bg-red-500/20 text-red-500' :
                      user.role === 'creator' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {user.role === 'admin' || user.role === 'founder' ? '管理员' : user.role === 'creator' ? '创作者' : '普通用户'}
                    </span>

                    {/* Ban Status */}
                    {user.status === 'banned' && (
                      <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                        已封禁
                      </span>
                    )}

                    {/* Stats */}
                    <div className="text-xs text-muted-foreground hidden md:block">
                      <span>作品: {user.userStats?.creationCount || 0}</span>
                      <span className="mx-2">|</span>
                      <span>评论: {user.userStats?.commentCount || 0}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {user.role !== 'admin' && user.role !== 'founder' && (
                        <>
                          <button
                            onClick={() => handleRoleChange(user.id, user.role === 'user' ? 'creator' : 'user')}
                            className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-500 transition"
                            title={user.role === 'user' ? '升级为创作者' : '降级为普通用户'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBan(user.id, user.status !== 'banned')}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition"
                            title={user.status === 'banned' ? '解封' : '封禁'}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/users/${user.id}`}
                        className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground transition"
                        title="查看主页"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                    </div>
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
