"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Check, X, Eye, Clock } from "lucide-react";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; nickname: string | null; username: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, resolved, all

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: "resolve" | "dismiss") => {
    try {
      const res = await fetch(`/api/admin/reports/${id}?action=${action}`, {
        method: 'PUT',
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回管理后台
          </Link>
          <h1 className="text-2xl font-bold text-foreground">举报管理</h1>
          <p className="text-muted-foreground text-sm mt-1">处理用户举报</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter */}
        <div className="flex gap-4 mb-6">
          {[
            { key: "pending", label: "待处理" },
            { key: "resolved", label: "已处理" },
            { key: "all", label: "全部" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === item.key
                  ? "bg-primary text-white"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="glass-card neon-border rounded-xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">暂无举报</div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((report) => (
                <div key={report.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-foreground">
                        举报类型: {report.targetType}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        report.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-green-500/20 text-green-500'
                      }`}>
                        {report.status === 'pending' ? '待处理' : '已处理'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <p className="text-foreground mb-2">{report.reason}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      举报人: @{report.reporter.username}
                    </p>
                    <div className="flex items-center gap-2">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(report.id, "resolve")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition text-sm"
                          >
                            <Check className="w-3 h-3" />
                            处理
                          </button>
                          <button
                            onClick={() => handleAction(report.id, "dismiss")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 transition text-sm"
                          >
                            <X className="w-3 h-3" />
                            忽略
                          </button>
                        </>
                      )}
                      <Link
                        href={report.targetType === 'creation'
                          ? `/creations/${report.targetId}`
                          : report.targetType === 'comment'
                          ? `/creations/${report.targetId}` // Comments don't have direct page
                          : `/mechas/${report.targetId}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm"
                      >
                        <Eye className="w-3 h-3" />
                        查看
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
