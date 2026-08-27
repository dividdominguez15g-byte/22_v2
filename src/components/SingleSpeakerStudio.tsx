import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Play,
  RotateCw,
  Wand2,
  SlidersHorizontal,
  CheckCircle2,
  FileText,
  Volume2,
  Layers,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { VoiceInfo, TonePreset, GeneratedAudioItem } from '../types';
import { SAMPLE_SCRIPTS, pcmToWavBlob } from '../utils/audioUtils';

interface SingleSpeakerStudioProps {
  voices: VoiceInfo[];
  presets: TonePreset[];
  onAudioGenerated: (audioItem: GeneratedAudioItem) => void;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
}

export const SingleSpeakerStudio: React.FC<SingleSpeakerStudioProps> = ({
  voices,
  presets,
  onAudioGenerated,
  selectedVoice,
  onSelectVoice,
}) => {
  const [text, setText] = useState(
    '¡Hola y bienvenido a Gemini TTS Studio! Aquí puedes transformar cualquier texto en voces hiperrealistas, con entonación natural, emociones y alta fidelidad.'
  );
  const [selectedTone, setSelectedTone] = useState<string>('cheerful');
  const [customToneDirective, setCustomToneDirective] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Femenino' | 'Masculino'>('ALL');

  // Stats calculation
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.5)); // ~150 wpm

  // Voice object
  const currentVoiceObj = voices.find((v) => v.id === selectedVoice) || voices[0];

  // Apply script preset
  const handleApplyPreset = (preset: typeof SAMPLE_SCRIPTS[0]) => {
    setText(preset.text);
    onSelectVoice(preset.voice);
    setSelectedTone(preset.tone);
    setCustomToneDirective('');
  };

  // AI Script Optimizer
  const handleEnhanceScript = async (style: string) => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/tts/enhance-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetStyle: style, language: 'es' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al optimizar');
      if (data.enhancedText) {
        setText(data.enhancedText);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo optimizar el guión.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Single Speaker Audio
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Por favor ingresa o selecciona un texto para generar el audio.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Determine tone directive
      let toneDirectiveToUse = '';
      if (customToneDirective.trim()) {
        toneDirectiveToUse = customToneDirective.trim();
      } else {
        const toneObj = presets.find((p) => p.id === selectedTone);
        if (toneObj) {
          toneDirectiveToUse = toneObj.directive;
        }
      }

      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          toneDirective: toneDirectiveToUse,
          language: 'es',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en la síntesis de voz.');
      }

      // Convert raw 24kHz PCM to WAV blob
      const wavBlob = pcmToWavBlob(data.audioBase64, data.sampleRate || 24000);
      const audioBlobUrl = URL.createObjectURL(wavBlob);

      const tonePresetObj = presets.find((p) => p.id === selectedTone);

      const newItem: GeneratedAudioItem = {
        id: `single_${Date.now()}`,
        title: text.length > 40 ? `${text.slice(0, 38)}...` : text,
        text: text.trim(),
        voice: selectedVoice,
        voiceName: currentVoiceObj ? currentVoiceObj.name : selectedVoice,
        audioBlobUrl,
        audioBase64: data.audioBase64,
        mimeType: 'audio/wav',
        sampleRate: data.sampleRate || 24000,
        createdAt: Date.now(),
        type: 'single',
        toneLabel: customToneDirective ? 'Personalizado' : (tonePresetObj?.label || 'Estándar'),
      };

      onAudioGenerated(newItem);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al conectar con la API de Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredVoices = voices.filter((v) => {
    if (genderFilter === 'ALL') return true;
    return v.gender === genderFilter;
  });

  return (
    <div id="single-speaker-studio" className="space-y-6">
      {/* Top Banner / Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Mic className="w-4 h-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Studio de Voz Individual
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Sintetiza locuciones con el modelo <strong className="text-indigo-300">gemini-3.1-flash-tts-preview</strong>. Elige entre 12 voces de alta fidelidad y modula la entonación y estilo dramático.
            </p>
          </div>

          {/* Quick Script Presets */}
          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs text-slate-400 font-medium mr-1">Ejemplos:</span>
            {SAMPLE_SCRIPTS.slice(0, 4).map((preset) => (
              <button
                key={preset.title}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-900/40 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left editor & Right Voice Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Editor & AI Enhancer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            {/* Header of Editor */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-white">Guión de Locución</span>
              </div>

              {/* AI Enhancer dropdown / buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
                  title="Copiar texto"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-400" /> AI:
                  </span>
                  <button
                    disabled={isEnhancing}
                    onClick={() => handleEnhanceScript('punctuated')}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition-all"
                    title="Añadir pausas y puntuación expresiva"
                  >
                    Pausas
                  </button>
                  <button
                    disabled={isEnhancing}
                    onClick={() => handleEnhanceScript('natural')}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition-all"
                    title="Optimizar ritmo y cadencia natural"
                  >
                    Fluidez
                  </button>
                  <button
                    disabled={isEnhancing}
                    onClick={() => handleEnhanceScript('dramatic')}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition-all"
                    title="Estilo cinematográfico"
                  >
                    Dramático
                  </button>
                </div>
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                id="tts-script-input"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe o pega aquí el texto que deseas convertir a voz..."
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y font-normal"
              />

              {isEnhancing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 text-indigo-300 text-sm font-medium">
                  <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Gemini optimizando el guión...</span>
                </div>
              )}
            </div>

            {/* Quick punctuation helpers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[11px] text-slate-500">Insertar:</span>
                <button
                  type="button"
                  onClick={() => setText((prev) => prev + ' ... ')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                >
                  ... (Pausa)
                </button>
                <button
                  type="button"
                  onClick={() => setText((prev) => prev + ' — ')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                >
                  — (Guion)
                </button>
                <button
                  type="button"
                  onClick={() => setText((prev) => prev + ' ¡!')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                >
                  ¡Énfasis!
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span>
                  <strong className="text-slate-200">{charCount}</strong> caracteres
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-200">{wordCount}</strong> palabras
                </span>
                <span>•</span>
                <span className="text-indigo-400 font-medium">
                  ~{estimatedSeconds}s duración est.
                </span>
              </div>
            </div>

            {/* Tone & Emotion Directives Section */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Emoción y Tono de la Voz</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Modula la intención y estilo de lectura
                </span>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedTone(preset.id);
                      setCustomToneDirective('');
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between border ${
                      selectedTone === preset.id && !customToneDirective
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{preset.label}</span>
                    {selectedTone === preset.id && !customToneDirective && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom directive input */}
              <div className="pt-1">
                <input
                  type="text"
                  value={customToneDirective}
                  onChange={(e) => setCustomToneDirective(e.target.value)}
                  placeholder="O escribe una instrucción de tono personalizada (ej: 'Habla con suspenso y voz muy baja...')"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action button */}
            <button
              id="btn-generate-tts"
              disabled={isGenerating || !text.trim()}
              onClick={handleGenerate}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sintetizando voz con Gemini AI...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Generar Audio ({currentVoiceObj?.name || selectedVoice})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Voice Selection Grid */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            {/* Header & Filter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-white">Catálogo de Voces</span>
              </div>

              {/* Gender Filter */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                {(['ALL', 'Femenino', 'Masculino'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setGenderFilter(filter)}
                    className={`px-2 py-0.5 rounded font-medium transition-all ${
                      genderFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'Todas' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => onSelectVoice(voice.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            voice.gender === 'Femenino'
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {voice.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-slate-100">
                              {voice.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                                voice.gender === 'Femenino'
                                  ? 'bg-pink-950/80 text-pink-300 border border-pink-800/40'
                                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                              }`}
                            >
                              {voice.gender}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tag pill */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {voice.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 leading-snug">
                      {voice.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
