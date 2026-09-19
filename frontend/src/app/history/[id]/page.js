'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import ResultCard from '../../../components/ResultCard';

export default function VerificationReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/history/${id}`);
        // Format to match standard verification response
        const record = res.data;
        const formatted = {
          ...record,
          weights: {
            model_probability: record.model_score,
            rule_score: record.rule_score,
            composite_score: record.composite_score
          },
          explanation: Array.isArray(record.explanation) ? record.explanation : [],
          indicators: typeof record.indicators === 'object' ? record.indicators : {},
          raw_details: {
            filename: record.file_path,
            id: record.id
          }
        };
        setResult(formatted);
      } catch (err) {
        setError('Verification record not found or network error.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <Link
          href="/history"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Verification History</span>
        </Link>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
          <span>Loading verification certificate...</span>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-8 text-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <ResultCard result={result} />
      )}
    </div>
  );
}
