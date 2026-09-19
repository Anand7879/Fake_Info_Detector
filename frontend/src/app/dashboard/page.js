'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, ShieldAlert, CheckCircle2, AlertTriangle,
  FileText, Image, Video, Link2, FileCode, ArrowRight, Clock,
  RefreshCw
} from 'lucide-react';
import api from '../../lib/api';
import AuthGuard from '../../components/AuthGuard';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalScans: 0,
    fakeCount: 0,
    realCount: 0,
    suspiciousCount: 0,
    modalityDistribution: { text: 0, image: 0, video: 0, url: 0, document: 0 },
    recentScans: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/history/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats.totalScans || 1;
  const dist = stats.modalityDistribution || {};

  return (
    <AuthGuard>
      <div className="space-y-8 pb-12">
        {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <LayoutDashboard className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            <span>Forensics Analytics Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time aggregated metrics across all verification channels</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs font-semibold glass-card px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Scans</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalScans}</span>
            <span className="text-xs text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/40">Multi-Modal</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Across 5 forensic modalities</p>
        </div>

        {/* Fake Detected */}
        <div className="glass-card rounded-2xl p-5 border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>Manipulated</span>
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{stats.fakeCount}</span>
            <span className="text-xs text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/40">
              {stats.totalScans ? `${Math.round((stats.fakeCount / stats.totalScans) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Flagged misinformation or tampering</p>
        </div>

        {/* Credible Real */}
        <div className="glass-card rounded-2xl p-5 border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Authentic</span>
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.realCount}</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
              {stats.totalScans ? `${Math.round((stats.realCount / stats.totalScans) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Passed forensic integrity checks</p>
        </div>

        {/* Suspicious */}
        <div className="glass-card rounded-2xl p-5 border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Suspicious</span>
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.suspiciousCount}</span>
            <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
              {stats.totalScans ? `${Math.round((stats.suspiciousCount / stats.totalScans) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Ambiguous signals requiring review</p>
        </div>
      </div>

      {/* Grid: Quick Actions & Modality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modality Distribution */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Modality Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Text Statements', count: dist.text || 0, color: 'bg-blue-500', href: '/verify/text' },
              { label: 'Image Forensics (ELA)', count: dist.image || 0, color: 'bg-purple-500', href: '/verify/image' },
              { label: 'Video Deepfakes', count: dist.video || 0, color: 'bg-emerald-500', href: '/verify/video' },
              { label: 'URL & Phishing', count: dist.url || 0, color: 'bg-amber-500', href: '/verify/url' },
              { label: 'Document Integrity', count: dist.document || 0, color: 'bg-rose-500', href: '/verify/document' },
            ].map((m, idx) => {
              const pct = stats.totalScans ? Math.round((m.count / stats.totalScans) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{m.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{m.count} scan(s) ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-none">
                    <div
                      className={`${m.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Quick Launch</h2>
            <div className="space-y-2">
              <Link
                href="/verify/text"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Verify News Text</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/verify/image"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Image className="w-4 h-4 text-purple-500" />
                  <span>Run Image ELA</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/verify/video"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-emerald-500" />
                  <span>Scan Deepfake Video</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/verify/url"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-amber-500" />
                  <span>Inspect Phishing Link</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </Link>
              <Link
                href="/verify/document"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-rose-500" />
                  <span>Verify PDF / DOCX</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </Link>
            </div>
          </div>

          <Link
            href="/history"
            className="w-full text-center text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 py-2 border border-cyan-200 dark:border-cyan-800/40 rounded-xl bg-cyan-50/50 hover:bg-cyan-50 dark:bg-transparent dark:hover:bg-cyan-950/40 transition-colors"
          >
            View Full Scan Log →
          </Link>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
