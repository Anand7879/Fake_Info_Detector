'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, UploadCloud, RefreshCw, AlertCircle, Eye, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../../../lib/api';
import ResultCard from '../../../components/ResultCard';

export default function ImageVerificationPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
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

      const res = await api.post('/verify/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Image verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <ImageIcon className="w-7 h-7 text-purple-500" />
          <span>AI-Assisted Image Authenticity & Deepfake Forensics</span>
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          5-Model vision ensemble (CommunityForensics ViT, SigLIP2, Dima806, Deepfake-v2, Deepfake-v1) + OpenCV facial feature inspection, Error Level Analysis (ELA), and EXIF tamper auditing.
        </p>
      </div>

      {/* Upload Box */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
              : 'border-slate-300 dark:border-slate-700/80 hover:border-purple-500/60 bg-slate-50/60 dark:bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview ? (
            <div className="text-center space-y-3 w-full max-w-lg">
              <img
                src={preview}
                alt="Selected preview"
                className="max-h-56 sm:max-h-64 mx-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-md object-contain bg-black/5 dark:bg-black/40"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)</p>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold underline block">Click or drop a different image to replace</span>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full inline-flex">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Click or drag image file here</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supports JPEG, PNG, WEBP, BMP, TIFF (Max 50MB)</p>
            </div>
          )}
        </label>

        {/* Dynamic Multi-Stage Loading State */}
        {loading && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-purple-300 dark:border-purple-500/30 space-y-3">
            <div className="flex items-center space-x-2.5 text-purple-700 dark:text-purple-400 text-sm font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>Running 5-Model Forensic Ensemble & Facial Inspection...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Image normalization & compression filtering</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Spatial facial detection & crop alignment</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="animate-spin text-purple-600 dark:text-purple-400 flex-shrink-0">⟳</span>
                <span className="text-slate-900 dark:text-white font-medium">5-Model vision transformer inference</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Ensemble agreement & calibrated evidence</span>
              </div>
            </div>
          </div>
        )}

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
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            <span>{loading ? 'Analyzing Ensemble Forensics...' : 'Run Multi-Model Forensics Scan'}</span>
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
