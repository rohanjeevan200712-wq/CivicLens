import React from 'react';
import { 
  Building2, Camera, MapPin, Globe, Sparkles, CheckCircle2, 
  HelpCircle, ShieldCheck, Search 
} from 'lucide-react';
import { LANGUAGES } from '../utils/translations';

export default function Navbar({ 
  currentTab, 
  onSelectTab, 
  currentLanguage, 
  onSelectLanguage, 
  t,
  isGeminiConfigured 
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top micro bar for AI status */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white">Google Gemini Multimodal AI:</span>
          <span className="text-slate-300">Active • 7+ Indian Languages Supported</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <span>Hackathon Demo Edition</span>
          <span>•</span>
          <span className="text-sky-300 font-medium">PromptWars 2026</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab('report')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-xl tracking-tight">
                Civic<span className="text-sky-600">Lens</span>
              </span>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                DEMO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => onSelectTab('report')}
            className={`tap-target sm:min-h-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'report'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t.reportTab}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('track')}
            className={`tap-target sm:min-h-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'track'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.trackTab}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('admin')}
            className={`tap-target sm:min-h-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t.adminTab}</span>
          </button>
        </nav>

        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <label htmlFor="lang-select" className="sr-only">Choose Language</label>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <select
                id="lang-select"
                value={currentLanguage}
                onChange={(e) => onSelectLanguage(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold cursor-pointer outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native} ({lang.label})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
