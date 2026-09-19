'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  // Step 1: 'request', Step 2: 'reset', Step 3: 'success'
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Request Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.dev_code) {
        setDevCode(res.data.dev_code);
        setCode(res.data.dev_code); // Pre-fill for instant test convenience
      }
      setSuccessMsg('A 6-digit verification code has been generated for your account.');
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        code,
        new_password: newPassword
      });
      setSuccessMsg(res.data.message || 'Password reset successfully!');
      setStep('success');
      setTimeout(() => {
        router.push('/login?reset_success=true');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 mb-1">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {step === 'request' && 'Reset your password'}
          {step === 'reset' && 'Enter verification code'}
          {step === 'success' && 'Password updated!'}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {step === 'request' && 'Enter your registered email address to receive a secure recovery code'}
          {step === 'reset' && `We generated a 6-digit recovery code for ${email}`}
          {step === 'success' && 'Your password has been changed. Redirecting you to sign in...'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dev Code Banner (for quick localhost testing) */}
      {devCode && step === 'reset' && (
        <div className="p-3 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-700/60 rounded-xl space-y-1 text-xs">
          <div className="flex items-center space-x-1.5 text-cyan-700 dark:text-cyan-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Local Verification Code:</span>
          </div>
          <p className="font-mono text-base text-cyan-800 dark:text-cyan-200 tracking-widest pl-1">{devCode}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">This code is logged to the server console and valid for 15 minutes.</p>
        </div>
      )}

      {/* STEP 1: Request Code */}
      {step === 'request' && (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registered Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@domain.com"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>{loading ? 'Sending Code...' : 'Send Recovery Code'}</span>
          </button>
        </form>
      )}

      {/* STEP 2: Enter Code & New Password */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">6-Digit Verification Code</label>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Change email
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-center font-mono text-lg tracking-widest text-cyan-600 dark:text-cyan-400 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full bg-white dark:bg-slate-900 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  passwordMismatch ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordMismatch && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordMismatch}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
          </button>
        </form>
      )}

      {/* STEP 3: Success State */}
      {step === 'success' && (
        <div className="py-6 text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{successMsg}</p>
          <div className="pt-2">
            <Link
              href="/login?reset_success=true"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              <span>Go to Sign In immediately</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      )}

      <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/login" className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto pt-10 pb-16">
      <Suspense fallback={
        <div className="p-8 text-center text-slate-400 text-xs">Loading recovery portal...</div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
