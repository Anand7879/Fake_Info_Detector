import './globals.css';
import Navbar from '../components/Navbar';
import { ShieldCheck, Github, Twitter, Linkedin } from 'lucide-react';

export const metadata = {
  title: 'Fake Info Detector — Multi-Modal AI Misinformation Verification Platform',
  description: 'AI-powered forensics platform verifying text, images, videos, URLs, and documents for tampering, deepfakes, and misinformation.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#050811] text-slate-100 dark:bg-[#050811] dark:text-slate-100 flex flex-col min-h-screen selection:bg-cyan-500 selection:text-white font-sans antialiased transition-colors duration-200">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-[#050811]/90 backdrop-blur-xl py-6 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Brand Logo & Name */}
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex items-center space-x-1.5 font-bold tracking-tight text-sm sm:text-base text-white">
                  <span>Fake Info</span>
                  <span className="text-cyan-400 font-extrabold uppercase text-xs sm:text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">DETECTOR</span>
                </div>
              </div>

              {/* Center Motto */}
              <div className="text-xs sm:text-sm text-slate-400 font-medium text-center">
                Truth Today. A Safer Tomorrow.
              </div>

              {/* Right Links & Socials */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
                <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
                <a href="#privacy" className="hover:text-cyan-400 transition-colors">Privacy</a>
                <a href="#feedback" className="hover:text-cyan-400 transition-colors">Feedback</a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors" aria-label="Twitter">
                    <Twitter className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors" aria-label="LinkedIn">
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors" aria-label="GitHub">
                    <Github className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}


