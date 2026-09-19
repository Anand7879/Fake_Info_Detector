'use client';

import React, { useState } from 'react';
import { Video as VideoIcon, UploadCloud, RefreshCw, AlertCircle, PlayCircle, Film } from 'lucide-react';
import api from '../../../lib/api';
import ResultCard from '../../../components/ResultCard';

export default function VideoVerificationPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/verify/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000 // Extended 180s timeout for video deepfake pipeline
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Video deepfake verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <VideoIcon className="w-7 h-7 text-emerald-500" />
          <span>Video Deepfake Verification</span>
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Samples video frames, extracts faces via OpenCV, and evaluates synthetic manipulation using MesoNet-4 facial CNN scoring.
        </p>
      </div>

      {/* Upload Box */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <label className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-slate-900/40">
          <input
            type="file"
            accept="video/mp4,video/avi,video/quicktime,video/webm"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview ? (
            <div className="text-center space-y-3 w-full max-w-lg">
              <video
                src={preview}
                controls
                className="max-h-56 sm:max-h-64 mx-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-md w-full object-contain bg-black/40"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold underline block">Click to choose a different video</span>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full inline-flex">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Click or drag video file here</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supports MP4, AVI, MOV, WEBM (Max 50MB)</p>
            </div>
          )}
        </label>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            onClick={handleVerify}
            disabled={loading || !file}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            <span>{loading ? 'Sampling Frames & Evaluating Forensics...' : 'Scan Video for Deepfakes'}</span>
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
