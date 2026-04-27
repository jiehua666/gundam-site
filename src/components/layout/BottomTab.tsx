"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Image, User } from "lucide-react";

export default function BottomTab() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: Home, label: "首页" },
    { href: "/mechas", icon: Bot, label: "机体" },
    { href: "/creations", icon: Image, label: "作品" },
    { href: "/profile", icon: User, label: "我的" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card neon-border border-t">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-4 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
