'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History as HistoryIcon,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Square,
  MinusSquare,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModality, setFilterModality] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/history');
      setRecords(res.data.verifications || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this verification record?')) return;
    try {
      await api.delete(`/history/${id}`);
      setRecords(records.filter(r => r.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert('Failed to delete verification record.');
    }
  };

  const filtered = records.filter((r) => {
    const matchesModality = filterModality === 'all' || r.modality === filterModality;
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.input_summary && r.input_summary.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesModality && matchesSearch;
  });

  // Multi-Select Logic
  const filteredIds = filtered.map(r => r.id);
  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const isPartiallySelected = !isAllSelected && filteredIds.some(id => selectedIds.has(id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`Are you sure you want to delete ${count} selected verification record(s)?`)) return;

    setBatchDeleting(true);
    setDeleteError('');
    const idsToDelete = Array.from(selectedIds);

    try {
      await api.post('/history/batch-delete', { ids: idsToDelete });
      setRecords(records.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Batch delete failed:', err);
      setDeleteError('Failed to delete selected records. Please try again.');
    } finally {
      setBatchDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <HistoryIcon className="w-7 h-7 text-cyan-500" />
            <span>Verification Scan History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review past scans, forensic explanations, downloadable certificates, and manage records
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs font-semibold glass-card px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter, Search & Batch Selection Bar */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={filterModality}
              onChange={(e) => setFilterModality(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Modalities</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="url">URL</option>
              <option value="document">Document</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSelectAll}
            disabled={filteredIds.length === 0}
            className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 flex-grow sm:flex-grow-0"
          >
            {isAllSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            ) : isPartiallySelected ? (
              <MinusSquare className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            ) : (
              <Square className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search claim, filename, or ID..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Batch Action Banner (Visible when records are selected) */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <span>{selectedIds.size} record(s) selected</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClearSelection}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={batchDeleting}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              {batchDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />}
              <span>{batchDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}</span>
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-500 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* History Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Modality</th>
                <th className="py-3.5 px-4">Input Summary</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-500" />
                    <span>Loading scan records...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No verification records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const pred = (r.prediction || 'suspicious').toLowerCase();
                  const isClean = pred === 'clean' || pred === 'harmless';
                  const isPhishing = pred === 'phishing';
                  const isMalware = pred === 'malware';
                  const isReal = pred === 'real' || pred === 'safe' || isClean;
                  const isFake = pred === 'fake' || pred === 'malicious' || isPhishing || isMalware;

                  const badgeClass = isReal
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isFake
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';

                  const BadgeIcon = isReal ? CheckCircle2 : isFake ? XCircle : AlertTriangle;
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/10 dark:bg-cyan-950/30'
                          : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-300 capitalize">
                        {r.modality}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                        {r.input_summary}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${badgeClass}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{pred}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {r.confidence_score}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={`/history/${r.id}`}
                          className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                          title="View detailed report"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

