"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Check } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function FollowButton({
  targetUserId,
  currentUserId,
  size = "md",
  showText = true,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (currentUserId && currentUserId !== targetUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(`/api/follows?check=${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } catch (error) {
      console.error("Failed to check follow status:", error);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`/api/follows?targetId=${targetUserId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFollowing(false);
          setIsChecked(true);
          setTimeout(() => setIsChecked(false), 2000);
        }
      } else {
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: targetUserId }),
        });
        if (res.ok) {
          setIsFollowing(true);
          setIsChecked(true);
          setTimeout(() => setIsChecked(false), 2000);
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if not logged in or trying to follow self
  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isChecked) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} rounded-lg bg-green-500 text-white flex items-center gap-1.5`}
      >
        <Check className={iconSizes[size]} />
        {showText && (size === "sm" ? "已操作" : "已操作")}
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`${sizeClasses[size]} rounded-lg border border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1.5 transition-colors disabled:opacity-50`}
      >
        <UserMinus className={iconSizes[size]} />
        {showText && (size === "sm" ? "取消关注" : "已关注")}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`${sizeClasses[size]} rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 transition-colors disabled:opacity-50`}
    >
      <UserPlus className={iconSizes[size]} />
      {showText && (size === "sm" ? "关注" : "关注")}
    </button>
  );
}
