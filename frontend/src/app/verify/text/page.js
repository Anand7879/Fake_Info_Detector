'use client';

import React, { useState } from 'react';
import { FileText, Sparkles, Send, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../../../lib/api';
import ResultCard from '../../../components/ResultCard';

export default function TextVerificationPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const sampleLaptop = "Government of India is distributing free laptops to all students under the National Student Laptop Scheme 2026. Register now to claim your laptop.";
  const sampleRahul = "Rahul Gandhi is Prime Minister of India";
  const sampleModi = "Narendra Modi is Prime Minister of India";
  const sampleMars = "Water is found in Mars";
  const sampleCredible = "According to a study published in Nature Medicine by researchers at Oxford University, regular moderate physical activity was associated with a 24% reduction in cardiovascular disease risk across a cohort of 50,000 adult participants.";
  const sampleFake = "SHOCKING! Doctors are FURIOUS! This secret herbal leaf cures ALL cancer in 48 hours and big pharma is trying to BANN IT from the public! Share this NOW before the elites delete this video forever!!!";

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/verify/text', { text });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Verification failed. Make sure the AI Engine is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <FileText className="w-7 h-7 text-blue-500" />
          <span>Text Misinformation Verification</span>
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Ground-truth verification with Google-style live Web AI Overview, encyclopedic records (NASA, Wikipedia, Reuters), and forensic NLP classifiers.
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        {/* Preset sample buttons */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Load Sample Claims:</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setText(sampleRahul)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50 dark:hover:bg-rose-900/60 transition-colors flex items-center space-x-1"
            >
              <span>Rahul Gandhi PM (False)</span>
            </button>
            <button
              type="button"
              onClick={() => setText(sampleModi)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-900/60 transition-colors flex items-center space-x-1"
            >
              <span>Narendra Modi PM (True)</span>
            </button>
            <button
              type="button"
              onClick={() => setText(sampleMars)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/50 dark:hover:bg-cyan-900/60 transition-colors flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-500 flex-shrink-0" />
              <span>Water on Mars</span>
            </button>
            <button
              type="button"
              onClick={() => setText(sampleLaptop)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/50 dark:hover:bg-purple-900/60 transition-colors flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-purple-500 flex-shrink-0" />
              <span>PIB Laptop Scheme (False)</span>
            </button>
            <button
              type="button"
              onClick={() => setText(sampleFake)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/60 transition-colors"
            >
              Health Scam
            </button>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste article text, social media claim, or headline to analyze..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3.5 sm:p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors resize-y"
            />
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{text.split(/\s+/).filter(Boolean).length} words</span>
              <span>{text.length} characters</span>
            </div>
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
              onClick={() => { setText(''); setResult(null); }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Evaluating Veracity...' : 'Verify Statement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Display */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
