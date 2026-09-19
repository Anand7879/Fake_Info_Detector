'use client';

import React, { useState } from 'react';
import { Link2, Send, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import api from '../../../lib/api';
import ResultCard from '../../../components/ResultCard';

export default function UrlVerificationPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const sampleReal = "https://sbi.co.in";
  const sampleEnterprise = "https://www.paypal.com/signin";
  const sampleBankClone = "http://onlinesbi-netbanking-verify.top/login";
  const sampleGiveaway = "http://free-iphone-giveaway.top/claim";
  const sampleTyposquat = "http://secure-login-paypa1.xyz/account/verify";
  const sampleIp = "http://192.168.1.50/banking/update-credentials";

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!url.trim()) return;

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/verify/url', { url: url.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'URL verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <Link2 className="w-7 h-7 text-amber-500" />
          <span>URL Phishing & Malicious Link Scanner</span>
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Audits URLs against Google Gemini 2.5 Flash cognitive security, Google Safe Browsing, VirusTotal, safe unshortener, suspicious TLDs, and 50+ brand typosquatting models.
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        {/* Preset sample buttons */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Load Sample URLs:</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setUrl(sampleReal)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/60 transition-colors"
            >
              Authentic Bank (SBI)
            </button>
            <button
              type="button"
              onClick={() => setUrl(sampleEnterprise)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/60 transition-colors"
            >
              Authentic Enterprise (PayPal)
            </button>
            <button
              type="button"
              onClick={() => setUrl(sampleBankClone)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/60 transition-colors"
            >
              Bank Clone (.top)
            </button>
            <button
              type="button"
              onClick={() => setUrl(sampleGiveaway)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/60 transition-colors"
            >
              Scam Giveaway (.top)
            </button>
            <button
              type="button"
              onClick={() => setUrl(sampleTyposquat)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/60 transition-colors"
            >
              Brand Typosquat (.xyz)
            </button>
            <button
              type="button"
              onClick={() => setUrl(sampleIp)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/60 transition-colors"
            >
              Raw IP Address Host
            </button>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example-banking.com/login"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => { setUrl(''); setResult(null); }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{loading ? 'Auditing URL Security...' : 'Inspect URL'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Display */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
