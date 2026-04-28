"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { ArrowLeft, Loader2, X, Image as ImageIcon, Bold, Italic, Link as LinkIcon, List, Quote, Code } from "lucide-react";

interface CreationImage {
  id: string;
  url: string;
  type: string;
  width: number | null;
  height: number | null;
}

interface Mecha {
  id: string;
  name: string;
  series: string;
}

export default function EditCreationPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const id = params.id as string;

  // Form data
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedMechaId, setRelatedMechaId] = useState("");
  const [tags, setTags] = useState("");
  const [copyrightType, setCopyrightType] = useState("original");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [authorId, setAuthorId] = useState("");

  // Fetch mechass for selection
  const [mechas, setMechas] = useState<Mecha[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    fetchCreation();
    fetchMechas();
  }, [user, isAuthenticated, id]);

  const fetchCreation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/creations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const creation = data.creation;
        setTitle(creation.title || "");
        setContent(creation.content || "");
        setRelatedMechaId(creation.mecha?.id || "");
        setTags(creation.tags || "");
        setCopyrightType(creation.copyrightType || "original");
        setImageUrls(creation.images?.map((img: CreationImage) => img.url) || []);
        setAuthorId(creation.author?.id || "");

        // Check if user is the author or admin
        if (creation.author?.id !== user.id && user.role !== 'admin' && user.role !== 'founder') {
          alert("您没有权限编辑此作品");
          router.push(`/creations/${id}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch creation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMechas = async () => {
    try {
      const res = await fetch('/api/mechas?limit=100');
      const data = await res.json();
      setMechas(data.mechas || []);
    } catch (error) {
      console.error('Failed to fetch mechas:', error);
    }
  };

  // Check auth
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">请先登录</p>
        <Link href="/login" className="cyber-button px-6 py-3 rounded-lg">
          登录
        </Link>
      </div>
    );
  }

  const handleAddImageUrl = () => {
    if (newImageUrl.trim() && newImageUrl.startsWith('http')) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("请输入作品标题");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/creations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          relatedMechaId,
          tags,
          copyrightType,
          imageUrls,
        }),
      });

      if (res.ok) {
        router.push(`/creations/${id}`);
      } else {
        const data = await res.json();
        alert(data.error || '更新失败，请重试');
      }
    } catch (error) {
      console.error('Failed to update:', error);
      alert('更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="py-8 px-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/creations/${id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作品详情
          </Link>

          <h1 className="text-3xl font-bold text-primary neon-glow">
            编辑作品
          </h1>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">基本信息</h3>

            <div>
              <label className="block text-foreground font-medium mb-2">
                作品标题 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的作品起个名字"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-foreground font-medium mb-2">
                作品描述
              </label>
              {/* Rich Text Editor Placeholder */}
              <div className="rounded-lg border border-input bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-input bg-muted/30">
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                    title="粗体"
                    disabled
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                    title="斜体"
                    disabled
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                    title="链接"
                    disabled
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                    title="列表"
                    disabled
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                    title="引用"
                    disabled
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                    title="代码"
                    disabled
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <span className="ml-auto text-xs text-muted-foreground">富文本功能开发中</span>
                </div>
                {/* Textarea */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="介绍一下你的作品..."
                  rows={6}
                  className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground font-medium mb-2">
                相关机体
              </label>
              <select
                value={relatedMechaId}
                onChange={(e) => setRelatedMechaId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">选择关联机体</option>
                {mechas.map((mecha) => (
                  <option key={mecha.id} value={mecha.id}>
                    {mecha.name} ({mecha.series})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-foreground font-medium mb-2">
                标签 (用逗号分隔)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="高达, 模型, 场景"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-foreground font-medium mb-2">
                版权类型
              </label>
              <div className="flex gap-4">
                {['original', 'repost', 'derivative'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="copyright"
                      value={type}
                      checked={copyrightType === type}
                      onChange={(e) => setCopyrightType(e.target.value)}
                      className="text-primary"
                    />
                    <span className="text-foreground">
                      {type === 'original' ? '原创' : type === 'repost' ? '转载' : '二创'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">图片</h3>
            <div>
              <label className="block text-foreground font-medium mb-2">
                图片链接
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                请输入图片的 URL 地址
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <button
                  onClick={handleAddImageUrl}
                  disabled={!newImageUrl.trim()}
                  className="px-4 py-3 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>

            {/* Image Previews */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/80 text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length === 0 && (
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p>暂无图片</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg cyber-button flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                更新中...
              </>
            ) : (
              '保存修改'
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
