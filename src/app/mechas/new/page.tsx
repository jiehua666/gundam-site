"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { ArrowLeft, Loader2, Plus, X, Trash2 } from "lucide-react";

interface Spec {
  specKey: string;
  specValue: string;
}

interface Palette {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function NewMechaPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [name, setName] = useState("");
  const [series, setSeries] = useState("");
  const [grade, setGrade] = useState("");
  const [classification, setClassification] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [summary, setSummary] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [powerSystem, setPowerSystem] = useState("");
  const [armor, setArmor] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);

  // New spec input
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  // New palette input
  const [newPaletteName, setNewPaletteName] = useState("");
  const [newPalettePrimary, setNewPalettePrimary] = useState("");
  const [newPaletteSecondary, setNewPaletteSecondary] = useState("");
  const [newPaletteAccent, setNewPaletteAccent] = useState("");

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

  // Check admin
  if (user.role !== 'admin' && user.role !== 'founder') {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center">
        <p className="text-destructive mb-4">只有管理员可以创建机体</p>
        <Link href="/mechas" className="cyber-button px-6 py-3 rounded-lg">
          返回机体库
        </Link>
      </div>
    );
  }

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecs([...specs, { specKey: newSpecKey.trim(), specValue: newSpecValue.trim() }]);
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleAddPalette = () => {
    if (newPaletteName.trim()) {
      setPalettes([...palettes, {
        name: newPaletteName.trim(),
        primaryColor: newPalettePrimary,
        secondaryColor: newPaletteSecondary,
        accentColor: newPaletteAccent,
      }]);
      setNewPaletteName("");
      setNewPalettePrimary("");
      setNewPaletteSecondary("");
      setNewPaletteAccent("");
    }
  };

  const handleRemovePalette = (index: number) => {
    setPalettes(palettes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("请输入机体名称");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mechas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          series,
          grade,
          classification,
          coverImage,
          summary,
          height,
          weight,
          powerSystem,
          armor,
          specs,
          palettes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/mechas/${data.mecha.id}`);
      } else {
        const data = await res.json();
        alert(data.error || '创建失败，请重试');
      }
    } catch (error) {
      console.error('Failed to create:', error);
      alert('创建失败，请重试');
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
            href="/mechas"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回机体库
          </Link>

          <h1 className="text-3xl font-bold text-primary neon-glow">
            添加机体
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
                机体名称 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：RX-78-2 高达"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground font-medium mb-2">系列</label>
                <input
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="如：高达系列"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-foreground font-medium mb-2">等级</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">选择等级</option>
                  <option value="HG">HG (High Grade)</option>
                  <option value="MG">MG (Master Grade)</option>
                  <option value="PG">PG (Perfect Grade)</option>
                  <option value="RG">RG (Real Grade)</option>
                  <option value="MB">MB (Metal Build)</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-foreground font-medium mb-2">分类</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">选择分类</option>
                <option value="地球联邦">地球联邦</option>
                <option value="吉恩公国">吉恩公国</option>
                <option value="阿布罗迪">阿布罗迪</option>
                <option value="木星帝国">木星帝国</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>

          {/* Cover Image */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">封面图片</h3>
            <div>
              <label className="block text-foreground font-medium mb-2">图片链接</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            {coverImage && (
              <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                <img src={coverImage} alt="预览" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">简介</h3>
            <div>
              <label className="block text-foreground font-medium mb-2">简介描述</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="简要介绍这个机体..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">详细参数</h3>

            {/* Existing specs */}
            {specs.length > 0 && (
              <div className="space-y-2">
                {specs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{spec.specKey}:</span>
                    <span className="text-foreground flex-1">{spec.specValue}</span>
                    <button
                      onClick={() => handleRemoveSpec(index)}
                      className="p-1 hover:bg-destructive/20 rounded text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add spec */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="参数名"
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
              />
              <input
                type="text"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                placeholder="参数值"
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
              />
              <button
                onClick={handleAddSpec}
                className="px-3 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Palettes */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">配色方案</h3>

            {/* Existing palettes */}
            {palettes.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {palettes.map((palette, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                    <span className="text-foreground text-sm flex-1">{palette.name}</span>
                    <div className="flex gap-1">
                      {palette.primaryColor && (
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: palette.primaryColor }} />
                      )}
                      {palette.secondaryColor && (
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: palette.secondaryColor }} />
                      )}
                      {palette.accentColor && (
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: palette.accentColor }} />
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePalette(index)}
                      className="p-1 hover:bg-destructive/20 rounded text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add palette */}
            <div className="space-y-2">
              <input
                type="text"
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                placeholder="配色名称"
                className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPalettePrimary}
                  onChange={(e) => setNewPalettePrimary(e.target.value)}
                  placeholder="主色"
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
                <input
                  type="text"
                  value={newPaletteSecondary}
                  onChange={(e) => setNewPaletteSecondary(e.target.value)}
                  placeholder="辅色"
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
                <input
                  type="text"
                  value={newPaletteAccent}
                  onChange={(e) => setNewPaletteAccent(e.target.value)}
                  placeholder="强调色"
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
                <button
                  onClick={handleAddPalette}
                  className="px-3 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Physical Specs */}
          <div className="glass-card neon-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">物理参数</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground font-medium mb-2">身高</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="如：18.5m"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-foreground font-medium mb-2">重量</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="如：43.4t"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-foreground font-medium mb-2">动力系统</label>
              <input
                type="text"
                value={powerSystem}
                onChange={(e) => setPowerSystem(e.target.value)}
                placeholder="如：太阳能驱动"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-foreground font-medium mb-2">装甲材质</label>
              <input
                type="text"
                value={armor}
                onChange={(e) => setArmor(e.target.value)}
                placeholder="如：高达尼姆合金"
                className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
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
                创建中...
              </>
            ) : (
              '创建机体'
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
