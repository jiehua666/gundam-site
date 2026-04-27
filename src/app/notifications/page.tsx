"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Trash2, Loader2, Filter } from "lucide-react";
import { useNotificationStore } from "@/lib/store";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'collect' | 'system' | 'achievement';

export default function NotificationsPage() {
  const { unreadCount, setUnreadCount, decrementUnread, clearUnread } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const pageSize = 20;

  useEffect(() => {
    fetchNotifications(true);
    fetchUnreadCount();
  }, [filter]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?pageSize=1');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    setIsLoading(true);
    try {
      let url = `/api/notifications?page=${currentPage}&pageSize=${pageSize}`;
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        setHasMore(currentPage < data.pagination.totalPages);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        decrementUnread();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all${filter !== 'all' ? `?type=${filter}` : ''}`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        clearUnread();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const notification = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.isRead) {
          decrementUnread();
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(false);
    }
  };

  // Get icon by type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'collect': return '⭐';
      case 'achievement':
      case 'level_up': return '🎉';
      case 'audit_pass': return '✅';
      case 'audit_reject': return '❌';
      case 'system': return '🔔';
      default: return '📬';
    }
  };

  // Get type name
  const getTypeName = (type: string) => {
    switch (type) {
      case 'like': return '点赞';
      case 'comment': return '评论';
      case 'follow': return '关注';
      case 'collect': return '收藏';
      case 'achievement': return '成就';
      case 'level_up': return '升级';
      case 'audit_pass': return '审核通过';
      case 'audit_reject': return '审核拒绝';
      case 'system': return '系统';
      default: return type;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'like', label: '点赞' },
    { value: 'comment', label: '评论' },
    { value: 'follow', label: '关注' },
    { value: 'collect', label: '收藏' },
    { value: 'achievement', label: '成就' },
    { value: 'system', label: '系统' },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="relative pt-20 px-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary neon-glow mb-2">
                通知
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} 条未读` : '暂无未读通知'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                全部已读
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="border-b border-border sticky top-16 bg-background/80 backdrop-blur-lg z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setFilter(option.value);
                  setPage(1);
                  setHasMore(true);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filter === option.value
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications List */}
      <section className="py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无通知</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`glass-card neon-border-hover rounded-xl p-4 transition-all hover:scale-[1.01] ${
                      !notification.isRead ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-foreground ${!notification.isRead ? 'font-medium' : ''}`}>
                              {notification.title}
                            </p>
                            {notification.content && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.content}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{getTypeName(notification.type)}</span>
                              <span>•</span>
                              <span>{formatTime(notification.createdAt)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 hover:bg-primary/10 rounded-lg text-primary transition"
                                title="标记已读"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                    )}
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-6 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        加载中...
                      </span>
                    ) : (
                      '加载更多'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
