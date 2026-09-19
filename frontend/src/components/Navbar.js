'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Home,
  FileText,
  Image,
  Video,
  Link2,
  FileCode,
  LayoutDashboard,
  History,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { getAuthUser, clearAuthSession } from '../lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setUser(getAuthUser());
    update();

    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light') {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      } else {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      setTheme('dark');
    }

    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);

    window.addEventListener('auth-state-change', update);
    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener('auth-state-change', update);
      window.removeEventListener('storage', update);
    };
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    router.push('/login');
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Text', href: '/verify/text', icon: FileText },
    { label: 'Image', href: '/verify/image', icon: Image },
    { label: 'Video', href: '/verify/video', icon: Video },
    { label: 'URL', href: '/verify/url', icon: Link2 },
    { label: 'Document', href: '/verify/document', icon: FileCode },
    { label: 'History', href: '/history', icon: History },
  ];

  const displayName = user?.name || 'Anand Patel';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <header className="sticky top-0 z-50 bg-[#060913]/90 backdrop-blur-md border-b border-slate-800/80 transition-colors duration-200 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 py-2">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2 truncate">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">Fake Info</span>
              <span className="text-cyan-400 font-bold text-[10px] sm:text-xs border border-cyan-500/50 bg-cyan-950/40 px-2 py-0.5 rounded-full tracking-wider uppercase">
                DETECTOR
              </span>
            </div>
          </Link>

          {/* Center Navigation Pill Bar */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Theme Switcher + User Profile Pill + Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dual Sun/Moon Toggle Pill */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
                className="flex items-center space-x-1 bg-slate-900/90 border border-slate-700/80 rounded-full p-1 hover:border-slate-600 transition-all focus:outline-none"
              >
                <span className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'text-amber-400' : 'text-slate-500'}`}>
                  <Sun className="w-3.5 h-3.5" />
                </span>
                <span className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-indigo-400'}`}>
                  <Moon className="w-3.5 h-3.5" />
                </span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 pl-1 pr-2.5 py-1 rounded-full text-xs font-semibold text-slate-200 hover:border-slate-600 transition-all focus:outline-none shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {initialLetter}
                </div>
                <span className="truncate max-w-[110px]">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0b1222] border border-slate-700/80 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'security@fakeinfodetector.ai'}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Analytics Dashboard</span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Verification History</span>
                  </Link>
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-left border-t border-slate-800"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <div className="border-t border-slate-800 pt-1">
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-3.5 py-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/60"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800/90 py-3 space-y-1 animate-fadeIn">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile User Auth Section in Drawer */}
            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800/90 px-1">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <User className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Signed in as <strong>{user.name}</strong>
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log in</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold text-center shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

