"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, User } from "@/lib/store";
import { Send, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  toUser: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
}

interface Conversation {
  user: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    level: number;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    fromUserId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string | null;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black"><div className="text-zinc-600 dark:text-zinc-400">加载中...</div></div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation["user"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recallingId, setRecallingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, authLoading, router]);

  // If ?with= is specified, load that conversation directly
  useEffect(() => {
    if (withUserId && isAuthenticated) {
      loadMessages(withUserId);
    }
  }, [withUserId, isAuthenticated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (userId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/conversation/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setSelectedUser(data.otherUser);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedUser.id,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        // Refresh conversations to update last message
        loadConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const recallMessage = async (messageId: string) => {
    if (!window.confirm("撤回这条消息？")) return;

    setRecallingId(messageId);
    try {
      const res = await fetch(`/api/messages/${messageId}/recall`, {
        method: "PUT",
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isDeleted: true, content: "此消息已撤回" } : msg
          )
        );
        loadConversations();
      } else {
        const data = await res.json();
        alert(data.error || "撤回失败");
      }
    } catch (error) {
      console.error("Failed to recall message:", error);
    } finally {
      setRecallingId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const canRecall = (message: Message) => {
    if (message.fromUserId !== user?.id) return false;
    const createdAt = new Date(message.createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    return diff < 2 * 60 * 1000; // 2 minutes
  };

  const selectConversation = (conv: Conversation) => {
    if (conv.user) {
      loadMessages(conv.user.id);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-16">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden" style={{ height: "calc(100vh - 8rem)" }}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedUser && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setMessages([]);
                    loadConversations();
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {selectedUser ? `与 ${selectedUser.nickname} 的对话` : "我的私信"}
              </h1>
            </div>
          </div>

          <div className="flex" style={{ height: "calc(100% - 4rem)" }}>
            {/* Conversation List */}
            {!selectedUser && (
              <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="p-4 text-center text-zinc-500">加载中...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500">暂无私信</div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user?.id}
                      onClick={() => selectConversation(conv)}
                      className="w-full p-4 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 transition text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {conv.user?.nickname?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {conv.user?.nickname || "未知用户"}
                          </span>
                          {conv.lastMessage && (
                            <span className="text-xs text-zinc-400">
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 truncate mt-1">
                          {conv.lastMessage?.content || "暂无消息"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Chat Area */}
            {selectedUser ? (
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-center text-zinc-500 py-8">加载中...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">暂无消息，开始对话吧</div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.fromUserId === user?.id;
                      const canRecallMessage = canRecall(message);

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isMine
                                ? "bg-violet-600 text-white rounded-br-md"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md"
                            } ${message.isDeleted ? "italic opacity-60" : ""}`}
                          >
                            {message.isDeleted ? (
                              <p className="text-sm">{message.content}</p>
                            ) : (
                              <>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                <div className={`flex items-center justify-end gap-2 mt-1 ${isMine ? "text-violet-200" : "text-zinc-400"}`}>
                                  <span className="text-xs">{formatTime(message.createdAt)}</span>
                                  {isMine && canRecallMessage && (
                                    <button
                                      onClick={() => recallMessage(message.id)}
                                      disabled={recallingId === message.id}
                                      className="p-1 hover:bg-white/20 rounded transition"
                                      title="撤回"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入消息..."
                      maxLength={500}
                      className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state when no conversation selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">选择一个对话开始聊天</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
