"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Send, Trash2, Reply, MoreVertical } from "lucide-react";

interface CommentUser {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  level: number;
}

interface Comment {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentsSectionProps {
  targetType: "creation" | "mecha" | "comment";
  targetId: string;
  currentUserId?: string;
}

export default function CommentsSection({ targetType, targetId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  useEffect(() => {
    fetchComments();
  }, [targetType, targetId, page]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setComments(data.comments);
        } else {
          setComments((prev) => [...prev, ...data.comments]);
        }
        setTotalPages(data.pagination.totalPages);
        setShowAll(data.comments.length >= 10);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          content: newComment,
          parentId: replyingTo?.id || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
        setReplyingTo(null);
      } else {
        const data = await res.json();
        console.error("Failed to post comment:", data.error);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("确定删除这条评论？")) return;

    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const getCommentCount = () => {
    if (totalPages <= 1) return comments.length;
    return `查看全部 ${totalPages * 10}+ 评论`;
  };

  return (
    <div className="glass-card neon-border rounded-xl p-6">
      <h3 className="font-bold text-lg text-foreground mb-4">
        评论 {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span>回复 @{replyingTo.user.nickname}</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-primary hover:underline"
            >
              取消
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="发表你的评论..."
              className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none transition-colors"
              rows={2}
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {newComment.length}/1000
            </div>
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading && comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无评论，来发表第一条评论吧
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {comment.user.avatar ? (
                  <Image
                    src={comment.user.avatar}
                    alt={comment.user.nickname}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg text-primary font-bold">
                    {comment.user.nickname?.[0] || "U"}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {comment.user.nickname}
                  </span>
                  <span className="text-xs text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded">
                    Lv.{comment.user.level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-foreground/90 text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {/* Reply button */}
                  <button
                    onClick={() => setReplyingTo(comment)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    回复
                  </button>
                  {/* Delete button - only for owner or admin */}
                  {(currentUserId === comment.userId || currentUserId) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {page < totalPages && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-full py-2 text-center text-primary hover:underline text-sm"
            >
              加载更多评论
            </button>
          )}
        </div>
      )}
    </div>
  );
}
