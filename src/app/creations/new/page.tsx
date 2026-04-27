"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface Mecha {
  id: string;
  name: string;
  series: string;
}

export default function NewCreationPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedMechaId, setRelatedMechaId] = useState("");
  const [tags, setTags] = useState("");
  const [copyrightType, setCopyrightType] = useState("original");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Fetch mechass for selection
  const [mechas, setMechas] = useState<Mecha[]>([]);

  useEffect(() => {
    fetchMechas();
  }, []);

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
      const res = await fetch('/api/creations', {
        method: 'POST',
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
        const data = await res.json();
        // If we had image upload, we would upload images here
        // For now, redirect to the new creation
        router.push(`/creations/${data.creation.id}`);
      } else {
        alert('发布失败，请重试');
      }
    } catch (error) {
      console.error('Failed to create:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="py-8 px-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/creations"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作品区
          </Link>

          <h1 className="text-3xl font-bold text-primary neon-glow">
            发布作品
          </h1>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Steps Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-primary' : 'bg-primary/20'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-primary' : 'bg-primary/20'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
            }`}>
              3
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
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
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="介绍一下你的作品..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">
                  相关机体 <span className="text-xs text-muted-foreground">(必选)</span>
                </label>
                <select
                  value={relatedMechaId}
                  onChange={(e) => setRelatedMechaId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
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

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-lg cyber-button"
                disabled={!title.trim() || !relatedMechaId}
              >
                下一步
              </button>
            </div>
          )}

          {/* Step 2: Upload Images */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-foreground font-medium mb-2">
                  图片链接
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  请输入图片的 URL 地址（如：https://example.com/image.jpg）
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

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition"
                >
                  上一步
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-lg cyber-button"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="glass-card neon-border rounded-xl overflow-hidden">
                {/* Cover Image */}
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
                  {imageUrls[0] ? (
                    <img src={imageUrls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-muted-foreground line-clamp-3">{content || '暂无描述'}</p>

                  {tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {tags.split(',').map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 rounded bg-primary/20 text-primary text-sm">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-lg cyber-button flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      发布中...
                    </>
                  ) : (
                    '发布作品'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}