'use client';

import Link from 'next/link';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Link2, 
  FileCode, 
  ArrowRight, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Scan, 
  Fingerprint, 
  Globe, 
  Cpu, 
  Eye,
  Shield,
  Layers,
  Search
} from 'lucide-react';

export default function HomePage() {
  const stats = [
    { value: '10K+', label: 'Scans Performed', color: 'from-cyan-400 to-blue-500' },
    { value: '95%+', label: 'Detection Accuracy', color: 'from-emerald-400 to-teal-400' },
    { value: '< 5s', label: 'Average Scan Time', color: 'from-sky-400 to-cyan-300' },
    { value: '5', label: 'AI Modalities', color: 'from-purple-400 to-indigo-400' },
  ];

  const primaryEngines = [
    {
      title: 'Text Verification',
      desc: 'Detects fabricated news, sensationalized clickbait, and conspiracy narratives using zero-shot transformers & forensic heuristics.',
      href: '/verify/text',
      icon: FileText,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/20',
      accentColor: 'hover:border-blue-500/50',
      pills: ['DistilBERT / BART', 'Sentiment Drift', 'Sensationalism Score'],
    },
    {
      title: 'Image Forensics',
      desc: 'Reveals spliced elements and digital cloning through Error Level Analysis (ELA), Laplacian blur variance, and EXIF software tampering tags.',
      href: '/verify/image',
      icon: ImageIcon,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30 shadow-purple-500/20',
      accentColor: 'hover:border-purple-500/50',
      pills: ['Error Level Analysis (ELA)', 'Laplacian Blur', 'EXIF Metadata Tampering'],
    },
    {
      title: 'Video Deepfake Detection',
      desc: 'Performs frame-by-frame face extraction, MesoNet-4 facial CNN evaluation, and temporal boundary seam tracking to uncover synthetic replacements.',
      href: '/verify/video',
      icon: Video,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/20',
      accentColor: 'hover:border-emerald-500/50',
      pills: ['MesoNet-4 CNN', 'Haar Cascades', 'Temporal Face Tracking'],
    },
  ];

  const secondaryEngines = [
    {
      title: 'URL & Phishing Scanner',
      desc: 'Cross-checks Google Safe Browsing, VirusTotal, suspicious disposable TLDs, and Levenshtein typosquatting against major enterprise brands.',
      href: '/verify/url',
      icon: Link2,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30 shadow-amber-500/20',
      accentColor: 'hover:border-amber-500/50',
      pills: ['Safe Browsing Engine', 'VirusTotal Hash Audit', 'Levenshtein Typosquatting'],
    },
    {
      title: 'Document Authenticity',
      desc: 'Extracts text streams and catalog metadata from PDF, DOCX, and TXT files to identify timeline modification drift and content fabrication.',
      href: '/verify/document',
      icon: FileCode,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30 shadow-rose-500/20',
      accentColor: 'hover:border-rose-500/50',
      pills: ['PyMuPDF Engine', 'docx Text Forensics', 'Metadata Drift Audit'],
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-4 pb-6 overflow-hidden">
        {/* Subtle background ambient glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold shadow-sm shadow-cyan-500/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="tracking-wide">AI-Powered • Multi-Modal Forensics Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Verify Digital Content <br className="hidden sm:inline" />
              Across{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                5 Distinct
              </span>{' '}
              Modalities
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
              Advanced forensic verification for text, images, videos, URLs, and documents. Powered by state-of-the-art AI models, computer vision, and cryptographic analysis.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/verify/text"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 hover:from-cyan-400 hover:to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>Start Free Scan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all duration-200 backdrop-blur-md"
              >
                <span>View Dashboard</span>
              </Link>
            </div>

            {/* Feature Checkmarks */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-y-2 gap-x-5 pt-2 text-xs sm:text-sm text-slate-300 font-medium">
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Accurate Results</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Explainable AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Privacy Focused</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Free to Use</span>
              </div>
            </div>
          </div>

          {/* Hero Right Column: 3D Holographic HUD Tablet & Floating Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[380px] lg:min-h-[440px]">
            {/* Glowing radial backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/15 rounded-3xl filter blur-2xl pointer-events-none" />

            {/* Central HUD Scanner Tablet */}
            <div className="relative z-10 w-full max-w-[320px] sm:max-w-[340px] rounded-3xl p-6 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#050811] border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl text-center">
              {/* Scan grid effect */}
              <div className="absolute inset-x-4 top-3 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              
              {/* Scanner Reticle / Fingerprint / Shield */}
              <div className="mx-auto my-4 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border border-cyan-500/40 p-4 flex flex-col items-center justify-center relative group shadow-inner">
                {/* Corner reticle marks */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />
                
                {/* Center Icon */}
                <div className="relative flex items-center justify-center">
                  <Fingerprint className="w-12 h-12 sm:w-14 sm:h-14 text-cyan-400 stroke-[1.5] animate-pulse" />
                  <Search className="w-6 h-6 text-sky-200 absolute -bottom-1 -right-1 drop-shadow-md" />
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Forensic Scanner Active</p>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider">TRUTH MATTERS</h3>
                <p className="text-[11px] text-slate-400 font-mono">Neural Biometrics & Pattern AI</p>
              </div>

              {/* Live Mini Radar Status */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-medium">Scanning Node</span>
                </span>
                <span className="font-mono text-cyan-300 font-semibold">99.8% Integrity</span>
              </div>
            </div>

            {/* Floating Satellite Badges */}
            {/* Top Left: Text */}
            <div className="absolute -top-3 -left-2 sm:top-2 sm:left-0 z-20 px-3 py-2 rounded-xl bg-slate-900/90 border border-blue-500/40 shadow-lg shadow-blue-500/20 backdrop-blur-md flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-tight">Text</p>
                <p className="text-[9px] text-slate-400 font-mono">Natural Language</p>
              </div>
            </div>

            {/* Top Right: Image */}
            <div className="absolute -top-2 -right-2 sm:top-4 sm:right-0 z-20 px-3 py-2 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-lg shadow-purple-500/20 backdrop-blur-md flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-tight">Image</p>
                <p className="text-[9px] text-slate-400 font-mono">ELA Forensics</p>
              </div>
            </div>

            {/* Bottom Left: URL */}
            <div className="absolute -bottom-4 left-0 sm:bottom-4 sm:-left-4 z-20 px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-lg shadow-amber-500/20 backdrop-blur-md flex items-center space-x-2">
              <Link2 className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-tight">URL</p>
                <p className="text-[9px] text-slate-400 font-mono">Phishing Radar</p>
              </div>
            </div>

            {/* Bottom Right: Video */}
            <div className="absolute bottom-2 -right-2 sm:bottom-8 sm:right-0 z-20 px-3 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 backdrop-blur-md flex items-center space-x-2">
              <Video className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-tight">Video</p>
                <p className="text-[9px] text-slate-400 font-mono">Deepfake CNN</p>
              </div>
            </div>

            {/* Handwritten sketch annotation note */}
            <div className="hidden sm:flex absolute -bottom-10 right-4 z-30 flex-col items-center pointer-events-none">
              <svg width="70" height="35" viewBox="0 0 70 35" fill="none" className="text-amber-300">
                <path d="M5 25 C 25 35, 45 5, 65 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" fill="none" />
                <polygon points="62,11 67,16 60,19" fill="currentColor" />
              </svg>
              <span className="font-handwriting text-amber-300 text-xl font-bold tracking-wide transform rotate-[-4deg]">
                Same Content Different Truths
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== METRIC STATS STRIP ===================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-2">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800/90 shadow-lg shadow-black/40 backdrop-blur-md text-center group hover:border-cyan-500/40 transition-all duration-200"
          >
            <div className={`text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1.5">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* ===================== FORENSIC ENGINES (3 + 2 GRID) ===================== */}
      <section className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Modal Forensics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Choose a Forensic Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Select a dedicated forensic analysis pipeline tailored for each media type.
          </p>
        </div>

        {/* Row 1: 3 Engines (Text, Image, Video) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {primaryEngines.map((engine, idx) => {
            const Icon = engine.icon;
            return (
              <div
                key={idx}
                className={`flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 ${engine.accentColor} shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-200 group hover:-translate-y-1`}
              >
                <div>
                  {/* Top Bar: Icon + Title */}
                  <div className="flex items-center space-x-3.5 mb-4">
                    <div className={`p-3 rounded-xl border shadow-sm ${engine.iconBg}`}>
                      <Icon className={`w-6 h-6 ${engine.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {engine.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {engine.desc}
                  </p>

                  {/* Tech Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {engine.pills.map((pill, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-300 font-medium"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={engine.href}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>Launch Scanner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={engine.href}
                    className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500 transition-all duration-200"
                    aria-label={`Launch ${engine.title}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: 2 Engines (URL, Document) + 1 Sketch Annotation Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {secondaryEngines.map((engine, idx) => {
            const Icon = engine.icon;
            return (
              <div
                key={idx}
                className={`flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 ${engine.accentColor} shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-200 group hover:-translate-y-1`}
              >
                <div>
                  {/* Top Bar: Icon + Title */}
                  <div className="flex items-center space-x-3.5 mb-4">
                    <div className={`p-3 rounded-xl border shadow-sm ${engine.iconBg}`}>
                      <Icon className={`w-6 h-6 ${engine.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {engine.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {engine.desc}
                  </p>

                  {/* Tech Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {engine.pills.map((pill, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-300 font-medium"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={engine.href}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>Launch Scanner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={engine.href}
                    className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500 transition-all duration-200"
                    aria-label={`Launch ${engine.title}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* 3rd Item in Row 2: Sketch Annotation & Security Shield Card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-[#050811] border border-slate-800/90 flex flex-col justify-between overflow-hidden shadow-xl shadow-black/40">
            {/* Background Shield Watermark */}
            <div className="absolute -right-6 -bottom-6 text-slate-800/30 pointer-events-none">
              <ShieldCheck className="w-44 h-44 stroke-[1]" />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Forensic Integrity Guard</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Comprehensive Multi-Layer Defense
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                Every scan executes cryptographic hash validation, zero-shot transformer heuristics, and machine learning models for tamper-proof verification.
              </p>
            </div>

            {/* Handwritten sketch annotation note */}
            <div className="relative z-10 pt-6 flex items-center space-x-3">
              <svg width="45" height="40" viewBox="0 0 45 40" fill="none" className="text-amber-300 transform -rotate-12">
                <path d="M10 5 C 20 20, 25 30, 40 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" fill="none" />
                <polygon points="36,27 42,32 35,36" fill="currentColor" />
              </svg>
              <span className="font-handwriting text-amber-300 text-2xl font-bold tracking-wider transform rotate-[-2deg]">
                Scan. Analyze. Stay Informed.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
