"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun, Menu, X, Search } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useAppTheme } from "@/components/Providers";

export default function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useAppTheme();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Verify token with server on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Inject animation styles
    const styleId = "logo-animation-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .logo-animated {
          background: linear-gradient(90deg, #7C3AED 0%, #22D3EE 25%, #F43F5E 50%, #F59E0B 75%, #7C3AED 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -moz-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          -moz-text-fill-color: transparent;
          animation: gradient-flow 3s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card neon-border border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold logo-animated">GUNDAM SITE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/mechas" className="text-foreground hover:text-primary transition">
              机体库
            </Link>
            <Link href="/creations" className="text-foreground hover:text-primary transition">
              作品
            </Link>
            <Link href="/rankings" className="text-foreground hover:text-primary transition">
              排行
            </Link>
            <Link href="/activities" className="text-foreground hover:text-primary transition">
              活动
            </Link>
            <Link href="/announcements" className="text-foreground hover:text-primary transition">
              公告
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-lg border border-primary/30 hover:bg-primary/10 transition"
            >
              <Search className="w-5 h-5 text-primary" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-primary/30 hover:bg-primary/10 transition"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <Link
                href="/settings"
                className="px-4 py-2 rounded-lg cyber-button text-sm"
              >
                {user.nickname}
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition text-sm"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg cyber-button text-sm"
                >
                  注册
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-primary/30 hover:bg-primary/10 transition"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索机体、作品、用户..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                autoFocus
              />
            </div>
          </form>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border pt-4 mb-4 -mx-4 px-4">
            <div className="flex flex-col gap-3">
              <Link
                href="/mechas"
                className="px-4 py-2 text-foreground hover:bg-primary/10 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                机体库
              </Link>
              <Link
                href="/creations"
                className="px-4 py-2 text-foreground hover:bg-primary/10 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                作品
              </Link>
              <Link
                href="/rankings"
                className="px-4 py-2 text-foreground hover:bg-primary/10 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                排行
              </Link>
              <Link
                href="/activities"
                className="px-4 py-2 text-foreground hover:bg-primary/10 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                活动
              </Link>
              <Link
                href="/announcements"
                className="px-4 py-2 text-foreground hover:bg-primary/10 rounded-lg transition"
                onClick={() => setIsMenuOpen(false)}
              >
                公告
              </Link>
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Link
                    href="/login"
                    className="flex-1 px-4 py-2 text-center rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 px-4 py-2 text-center rounded-lg cyber-button"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
