import React, { useState, useEffect, useRef } from 'react';
import { Mic, Users, BookOpen, History, Sparkles, Volume2, Download, Check, Image as ImageIcon, Upload, Trash2, Sliders, X, AlertCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'single' | 'dialogue' | 'voices' | 'history';
  onTabChange: (tab: 'single' | 'dialogue' | 'voices' | 'history') => void;
  historyCount: number;
  customBg?: string | null;
  bgOpacity?: number;
  onUpdateBg?: (bg: string | null) => void;
  onUpdateBgOpacity?: (opacity: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  historyCount,
  customBg,
  bgOpacity = 0.3,
  onUpdateBg,
  onUpdateBgOpacity,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isBgMenuOpen, setIsBgMenuOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsBgMenuOpen(false);
      }
    };
    if (isBgMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBgMenuOpen]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar en iPhone/iPad: toca el botón de Compartir en Safari y selecciona "Agregar al inicio". En Chrome/Edge: haz clic en el icono de instalación en la barra de direcciones.');
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);

    // Max 5MB (~5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)}MB. El límite máximo es de 5MB.`);
      return;
    }

    // Supported formats: PNG, JPG, GIF, WebP
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato no soportado. Por favor utiliza PNG, JPG, WebP o GIF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && onUpdateBg) {
        onUpdateBg(result);
        setUploadError(null);
      }
    };
    reader.onerror = () => {
      setUploadError('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 text-white">
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
                  PWA AI
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

          {/* Right side controls: Background Customizer, PWA install & Model info */}
          <div className="flex items-center gap-2 relative">
            {/* Hidden File Input for Custom Background */}
            <input
              id="input-upload-background"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
              className="hidden"
            />

            {/* Background Customizer Dropdown Toggle Button */}
            <div className="relative">
              <button
                id="btn-toggle-bg-settings"
                onClick={() => setIsBgMenuOpen(!isBgMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  customBg
                    ? 'bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-200 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80 hover:text-white'
                }`}
                title="Personalizar fondo de pantalla (PNG, GIF, JPG - Máx 5MB)"
                aria-expanded={isBgMenuOpen}
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Fondo</span>
                {customBg && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>

              {/* Background Settings Dropdown Menu */}
              {isBgMenuOpen && (
                <div
                  id="dropdown-bg-settings"
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-80 sm:w-96 p-4 bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 z-50 text-slate-100 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">Fondo de Pantalla</h3>
                    </div>
                    <button
                      id="btn-close-bg-dropdown"
                      onClick={() => setIsBgMenuOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Upload Zone */}
                  <div className="mt-3">
                    <div
                      id="dropzone-bg-upload"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                          : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-200">
                        Haz clic o arrastra una imagen aquí
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PNG (recomendado), GIF, JPG o WebP
                      </p>
                      <div className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Límite: hasta ~5 MB
                      </div>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {uploadError && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Active Background Settings & Opacity Slider */}
                  {customBg && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          Visibilidad del fondo:
                        </span>
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
                          {Math.round(bgOpacity * 100)}%
                        </span>
                      </div>

                      {/* Opacity Range Input */}
                      <input
                        id="input-bg-opacity-slider"
                        type="range"
                        min="0.10"
                        max="0.80"
                        step="0.05"
                        value={bgOpacity}
                        onChange={(e) => onUpdateBgOpacity?.(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />

                      {/* Preset Buttons */}
                      <div className="flex items-center gap-1.5 justify-between">
                        {[
                          { label: '15%', value: 0.15 },
                          { label: '30% (Ideal)', value: 0.30 },
                          { label: '50%', value: 0.50 },
                          { label: '70%', value: 0.70 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            id={`btn-opacity-preset-${Math.round(preset.value * 100)}`}
                            onClick={() => onUpdateBgOpacity?.(preset.value)}
                            className={`flex-1 py-1 px-1 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                              Math.abs(bgOpacity - preset.value) < 0.04
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Remove Background Button */}
                      <button
                        id="btn-remove-custom-bg"
                        onClick={() => {
                          onUpdateBg?.(null);
                          setUploadError(null);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition-colors cursor-pointer mt-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Restablecer fondo oscuro predeterminado</span>
                      </button>
                    </div>
                  )}

                  {/* PWA App Install Link inside dropdown */}
                  {!isInstalled && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <button
                        id="btn-dropdown-install-pwa"
                        onClick={() => {
                          setIsBgMenuOpen(false);
                          handleInstallClick();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm shadow-indigo-500/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Instalar aplicación (PWA)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Standalone PWA install button when not open */}
            {!isInstalled && (
              <button
                id="btn-install-pwa"
                onClick={handleInstallClick}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-sm shadow-indigo-500/30 border border-indigo-400/30 transition-all cursor-pointer"
                title="Instalar como App PWA en tu dispositivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            )}

            {isInstalled && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>PWA Lista</span>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TTS 3.1</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
