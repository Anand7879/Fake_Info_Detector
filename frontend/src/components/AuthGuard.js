'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { isAuthenticated } from '../lib/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAuthenticated();
      if (!auth) {
        setAuthorized(false);
        setChecking(false);
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || '/')}`;
        router.replace(redirectUrl);
      } else {
        setAuthorized(true);
        setChecking(false);
      }
    };

    checkAuth();

    // Listen for cross-tab or in-app logout
    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-state-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Verifying authentication session...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-card border border-rose-200 dark:border-rose-500/30 rounded-2xl shadow-xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This AI verification module requires an active user account. Please log in or create an account to access multi-modal forensic analysis.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname || '/')}`}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-cyan-600/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/register"
            className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
