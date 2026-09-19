'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Cpu,
  Scale,
  Users,
  Layers,
  Activity,
  Camera,
  Info,
  Sparkles,
  Globe,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import { generatePdfReport } from '../lib/pdfReport';

export default function ResultCard({ result }) {
  const [showEla, setShowEla] = useState(false);
  const [showModels, setShowModels] = useState(false);

  if (!result) return null;

  const isImageModality = result.modality === 'image';
  const isUrlModality = result.modality === 'url';
  const pred = (result.prediction || 'suspicious').toLowerCase();

  const isClean = pred === 'clean' || pred === 'harmless';
  const isPhishing = pred === 'phishing';
  const isMalware = pred === 'malware';
  const isReal = pred === 'real' || pred === 'safe' || isClean;
  const isFake = pred === 'fake' || pred === 'malicious' || isPhishing || isMalware;
  const isSuspicious = pred === 'suspicious' || (!isReal && !isFake);

  const weights = result.weights || {};
  const explanations = result.explanation || [];
  const rawDetails = result.raw_details || {};
  const aiOverview = result.ai_overview;
  const webSources = result.web_sources || [];

  // Status Badge Configuration
  let badgeConfig;
  if (isUrlModality) {
    if (isClean || pred === 'real' || pred === 'safe') {
      badgeConfig = { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400', icon: CheckCircle2, title: 'CLEAN / HARMLESS' };
    } else if (isPhishing) {
      badgeConfig = { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400', icon: XCircle, title: 'PHISHING / SOCIAL ENGINEERING' };
    } else if (isMalware) {
      badgeConfig = { bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400', icon: XCircle, title: 'MALWARE / EXPLOIT DETECTED' };
    } else if (isSuspicious) {
      badgeConfig = { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400', icon: AlertTriangle, title: 'SUSPICIOUS LINK' };
    } else {
      badgeConfig = { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400', icon: AlertTriangle, title: pred.toUpperCase() };
    }
  } else {
    badgeConfig = isReal
      ? { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400', icon: CheckCircle2, title: 'CREDIBLE / AUTHENTIC' }
      : isFake
      ? { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400', icon: XCircle, title: 'MANIPULATION DETECTED' }
      : { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400', icon: AlertTriangle, title: 'INCONCLUSIVE / UNCERTAIN' };
  }

  const StatusIcon = badgeConfig.icon;


  // Image Specific Data
  const classification = result.classification || {};
  const evidence = result.evidence || {};
  const modelSupport = result.model_support || {};
  const faces = result.faces || {};
  const models = result.models || [];
  const forensics = result.forensics || {};
  const quality = forensics.image_quality || rawDetails.quality || {};
  const certainty = classification.certainty || (isSuspicious ? 'low' : 'medium');
  const displayTitle = classification.display_title || (isReal ? 'Likely Authentic' : isFake ? 'Likely Manipulated / Deepfake' : 'Inconclusive / Mixed Evidence');
  const evidenceStrength = result.processing?.evidence_strength || (isSuspicious ? 'Conflicting / Weak' : 'Moderate');

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-700/60 transition-all space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className={`p-2.5 sm:p-3 rounded-xl border ${badgeConfig.bg} flex-shrink-0 mt-0.5 sm:mt-0`}>
            <StatusIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${badgeConfig.bg}`}>
                {badgeConfig.title}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 capitalize">
                • {result.modality || 'content'} analysis
              </span>
              {isImageModality && certainty && (
                <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded uppercase border ${
                  certainty === 'high' ? 'border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10' :
                  certainty === 'medium' ? 'border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10' :
                  'border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10'
                }`}>
                  {certainty} certainty
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              Verdict: <span className="capitalize">{isImageModality ? displayTitle : pred}</span>
            </h3>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium">Detection Confidence</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{result.confidence_score}%</span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center relative flex-shrink-0">
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                isReal ? 'border-emerald-500' : isFake ? 'border-rose-500' : 'border-amber-500'
              }`}
              style={{
                clipPath: `polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)`
              }}
            />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">AI</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IMAGE-SPECIFIC ENRICHED SECTION: EVIDENCE GROUPING, MODEL SUPPORT & FACE */}
      {/* ========================================================================= */}
      {isImageModality ? (
        <div className="space-y-6">
          {/* Evidence Breakdown & Model Support Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Evidence Breakdown (2 columns) */}
            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800/90 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="uppercase tracking-wider text-[11px]">Independent Evidence Scores</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-normal">Multi-Signal Distribution</span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Authenticity Evidence */}
                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Authenticity Evidence</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {((evidence.authenticity !== undefined ? evidence.authenticity : (result.scores?.real || 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (evidence.authenticity !== undefined ? evidence.authenticity : (result.scores?.real || 0)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Deepfake / Manipulation Evidence */}
                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Deepfake / Manipulation Evidence</span>
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {((evidence.deepfake_manipulation !== undefined ? evidence.deepfake_manipulation : (result.scores?.deepfake || 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (evidence.deepfake_manipulation !== undefined ? evidence.deepfake_manipulation : (result.scores?.deepfake || 0)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* AI Generation Evidence */}
                <div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>AI Generation Evidence</span>
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {((evidence.ai_generation !== undefined ? evidence.ai_generation : (result.scores?.ai_generated || 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (evidence.ai_generation !== undefined ? evidence.ai_generation : (result.scores?.ai_generated || 0)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Model Support & Consensus (1 column) */}
            <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800/90 flex flex-col justify-between space-y-3 shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Model Vote Consensus</span>
                </span>
                
                <div className="mt-2.5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/60">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Real / Authentic:</span>
                    <span className="font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 px-2 py-0.5 rounded">
                      {modelSupport.real !== undefined ? modelSupport.real : (result.indicators?.model_support?.real || 0)} / 5 Models
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/60">
                    <span className="text-rose-700 dark:text-rose-400 font-medium">Deepfake / Manipulated:</span>
                    <span className="font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 px-2 py-0.5 rounded">
                      {modelSupport.deepfake !== undefined ? modelSupport.deepfake : (result.indicators?.model_support?.deepfake || 0)} / 5 Models
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-purple-700 dark:text-purple-400 font-medium">AI Generation:</span>
                    <span className="font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20 px-2 py-0.5 rounded">
                      {modelSupport.ai_generated !== undefined ? modelSupport.ai_generated : (result.indicators?.model_support?.ai_generated || 0)} / 5 Models
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between items-center">
                <span>Evidence Strength:</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${
                  evidenceStrength === 'Strong' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' :
                  evidenceStrength === 'Moderate' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                }`}>
                  {evidenceStrength}
                </span>
              </div>
            </div>
          </div>

          {/* Image Quality & Metadata Strip */}
          {quality.resolution && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <span>
                  Resolution: <strong className="text-slate-900 dark:text-white">{quality.resolution}</strong> ({quality.megapixels} MP)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Sharpness: <strong className="text-slate-900 dark:text-white">{quality.sharpness}</strong> (Laplacian: {quality.blur_laplacian_var})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Faces Detected: <strong className="text-slate-900 dark:text-white">{faces.count || 0}</strong></span>
              </div>
            </div>
          )}

          {/* Dedicated Face Analysis Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-pink-500" />
                <span>Facial Forensics Path</span>
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                faces.detected
                  ? 'border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40'
              }`}>
                {faces.detected ? `${faces.count} Face(s) Inspected` : 'No Faces Detected'}
              </span>
            </div>

            {faces.detected && faces.results?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {faces.results.map((f) => {
                  const manipRisk = f.manipulation_score !== undefined ? f.manipulation_score : (f.deepfake_score || 0);
                  const isHighRisk = manipRisk >= 0.60;
                  const isModerateRisk = manipRisk >= 0.30 && manipRisk < 0.60;
                  return (
                    <div key={f.face_id} className="p-3 bg-white dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">Face #{f.face_id}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isHighRisk ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' :
                          isModerateRisk ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        }`}>
                          {f.verdict}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                        <span>Manipulation Risk:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200">{(manipRisk * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHighRisk ? 'bg-rose-500' : isModerateRisk ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, manipRisk * 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 break-all">
                        Region: [{f.bounding_box || f.box ? (f.bounding_box || f.box).join(', ') : 'crop'}]
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No human faces detected in image frame. Dedicated face crop classifiers were bypassed and full-frame global synthetic artifact models applied.
              </p>
            )}
          </div>

          {/* Expandable 5-Model Ensemble Breakdown */}
          {models.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4">
              <button
                onClick={() => setShowModels(!showModels)}
                className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>View 5-Model Individual Breakdown & Raw Scores</span>
                </span>
                {showModels ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showModels && (
                <div className="mt-3 overflow-x-auto -mx-1 sm:mx-0">
                  <table className="w-full min-w-[500px] text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Model Architecture</th>
                        <th className="p-2.5">Label</th>
                        <th className="p-2.5">Authenticity</th>
                        <th className="p-2.5">Manipulation / AI</th>
                        <th className="p-2.5">Raw Logits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
                      {models.map((m, idx) => {
                        const isMReal = (m.normalized_label || m.prediction || '').toLowerCase() === 'real';
                        const realScore = m.real_score !== undefined ? m.real_score : (m.scores?.real || 0);
                        const fakeScore = m.deepfake_score !== undefined ? m.deepfake_score : (m.fake_score !== undefined ? m.fake_score : (m.scores?.deepfake || 0));
                        const logitsStr = m.raw_logits ? `[${m.raw_logits.join(', ')}]` : 'N/A';
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                            <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200 text-[11px]">{m.model_name || m.name}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isMReal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-none' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-none'
                              }`}>
                                {m.normalized_label || m.prediction}
                              </span>
                            </td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono">
                              {(realScore * 100).toFixed(1)}%
                            </td>
                            <td className="p-2.5 text-rose-600 dark:text-rose-400 font-mono">
                              {(fakeScore * 100).toFixed(1)}%
                            </td>
                            <td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                              {logitsStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
 
      {/* ========================================================================= */}
      {/* GOOGLE-STYLE AI OVERVIEW & TRUSTED WEB REFERENCES SECTION (FOR TEXT)     */}
      {/* ========================================================================= */}
      {(aiOverview || webSources.length > 0) && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800/90 space-y-6 shadow-sm">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-sm">
                <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                    <span>Google-Style AI Overview</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20 uppercase tracking-wider">
                    Live Ground Truth
                  </span>
                  {aiOverview?.powered_by === 'gemini' ? (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-gradient-to-r dark:from-purple-500/20 dark:via-indigo-500/20 dark:to-blue-500/20 dark:text-blue-300 dark:border-blue-400/40 flex items-center space-x-1 uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-300" />
                      <span>Google Gemini AI</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center space-x-1 uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>IFCN Certified Network</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Synthesized fact-check cross-referenced against authoritative IFCN sources, official government portals, and encyclopedia records.
                </p>
              </div>
            </div>
            
            {webSources.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>{webSources.length} Sources Analyzed</span>
              </div>
            )}
          </div>

          {/* 2-Column Responsive Layout: Left = AI Overview Text, Right = Trusted Sources Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: AI Overview Summary & Key Points (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Lead Summary Card */}
              {aiOverview?.summary && (
                <div className="bg-white dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Synthesized Summary</span>
                    </span>
                    {aiOverview.citation_names && aiOverview.citation_names.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {aiOverview.citation_names.slice(0, 3).map((name, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
                    {aiOverview.summary}
                  </p>
                </div>
              )}

              {/* Key Evidence Findings Bullet Points */}
              {aiOverview?.key_points && aiOverview.key_points.length > 0 && (
                <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 shadow-sm">
                  <h5 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>Key Evidence Breakdown</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {aiOverview.key_points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start space-x-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          isReal ? 'bg-emerald-500' : isFake ? 'bg-rose-500' : 'bg-cyan-500'
                        }`} />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Trusted Source Reference Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Trusted Sources & References</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">External Citations</span>
              </div>

              {webSources.map((source, sIdx) => {
                const isDebunk = source.stance === 'debunks';
                const isConfirm = source.stance === 'confirms';
                const badgeStyle = isConfirm
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                  : isDebunk
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30';

                return (
                  <a
                    key={sIdx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white hover:bg-slate-50 dark:bg-slate-950/70 dark:hover:bg-slate-900 p-3 rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition-all group shadow-sm"
                  >
                    {/* Source Top: Favicon + Name + Stance */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        {source.favicon ? (
                          <img
                            src={source.favicon}
                            alt={source.source_name}
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {source.source_name}
                        </span>
                        {source.is_ifcn ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 font-bold flex items-center space-x-1 flex-shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            <span>IFCN Certified</span>
                          </span>
                        ) : source.is_authoritative && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 font-medium flex-shrink-0">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${badgeStyle}`}>
                          {source.stance_label || (isConfirm ? 'Confirms' : isDebunk ? 'Debunks' : 'Related')}
                        </span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>

                    {/* Headline Title */}
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                      {source.title}
                    </h5>

                    {/* Snippet */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {source.snippet}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Explainable Weighted Score Breakdown (90% ML Model Probability / 10% Rules) */}
      <div className="py-5 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Explainable Weighted Score Breakdown ({weights.model_weight !== undefined ? Math.round(weights.model_weight * 100) : 90}% ML / {weights.rule_weight !== undefined ? Math.round(weights.rule_weight * 100) : 10}% Rules)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                <span>Machine Learning Model ({weights.model_weight !== undefined ? Math.round(weights.model_weight * 100) : 90}% Weight)</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {weights.model_probability !== undefined ? `${(weights.model_probability * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${(weights.model_probability || 0) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Deep learning model probability</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                <span>Forensic Rules ({weights.rule_weight !== undefined ? Math.round(weights.rule_weight * 100) : 10}% Weight)</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {weights.rule_score !== undefined ? `${(weights.rule_score * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${(weights.rule_score || 0) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Rule heuristics & metadata checks</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span>Final Composite Score</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {weights.composite_score !== undefined ? `${(weights.composite_score * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isReal ? 'bg-emerald-500' : isFake ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${(weights.composite_score || 0) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              Formula: {(weights.model_weight !== undefined ? weights.model_weight : 0.90).toFixed(2)}·Model + {(weights.rule_weight !== undefined ? weights.rule_weight : 0.10).toFixed(2)}·Rules
            </span>
          </div>
        </div>
      </div>

      {/* Forensic Explanations List */}
      <div className="py-5 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          Forensic Signals & Evidence
        </h4>
        <ul className="space-y-2.5">
          {explanations.map((exp, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 text-sm text-slate-800 dark:text-slate-200">
              <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                isReal ? 'bg-emerald-500' : isFake ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
              <span className="leading-relaxed">{exp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Optional ELA Preview for Image Analysis */}
      {rawDetails.ela_preview_base64 && (
        <div className="py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowEla(!showEla)}
            className="flex items-center space-x-2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showEla ? 'Hide Error Level Analysis (ELA) Heatmap' : 'View Error Level Analysis (ELA) Heatmap'}</span>
            {showEla ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showEla && (
            <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <img
                src={rawDetails.ela_preview_base64}
                alt="ELA Heatmap"
                className="max-h-80 mx-auto rounded border border-slate-300 dark:border-slate-800 object-contain"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 text-center">
                High-contrast white or bright patches against uniform background indicate foreign compression artifacts from spliced/edited segments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 w-full sm:w-auto text-center sm:text-left truncate">
          Scan ID: <code className="text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-none px-2 py-0.5 rounded break-all">{result.id || 'local-scan'}</code>
        </div>
        <button
          onClick={() => generatePdfReport(result)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-cyan-600/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Verification Certificate (PDF)</span>
        </button>
      </div>
    </div>
  );
}
