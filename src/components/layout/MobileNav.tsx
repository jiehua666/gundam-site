"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Image, User, Compass, Calendar } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: Home, label: "首页" },
    { href: "/mechas", icon: Bot, label: "机体" },
    { href: "/creations", icon: Image, label: "作品" },
    { href: "/activities", icon: Calendar, label: "活动" },
    { href: "/rankings", icon: Compass, label: "排行" },
    { href: "/profile", icon: User, label: "我的" },
  ];

  return (
    <nav className="md:hidden fixed top-16 left-0 right-0 z-40 glass-card neon-border border-t">
      <div className="flex justify-around py-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}