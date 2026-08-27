import React from 'react';
import { Mic, Users, BookOpen, History, Sparkles, Volume2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'single' | 'dialogue' | 'voices' | 'history';
  onTabChange: (tab: 'single' | 'dialogue' | 'voices' | 'history') => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  historyCount,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  Gemini TTS Studio
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI 3.1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Text-to-Speech & Multi-Voice Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav id="nav-tabs" className="flex items-center p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <button
              id="tab-single-speaker"
              onClick={() => onTabChange('single')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voz Individual</span>
            </button>

            <button
              id="tab-dialogue"
              onClick={() => onTabChange('dialogue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'dialogue'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Diálogos & Podcast</span>
            </button>

            <button
              id="tab-voices"
              onClick={() => onTabChange('voices')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'voices'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Voces</span>
            </button>

            <button
              id="tab-history"
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-400/30 text-indigo-200 font-bold border border-indigo-400/40">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Model Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Modelo:</span>
            <span className="font-mono text-slate-200 font-semibold">gemini-3.1-flash-tts</span>
          </div>
        </div>
      </div>
    </header>
  );
};
