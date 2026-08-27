import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Play,
  RotateCw,
  Search,
  Check,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { VoiceInfo, GeneratedAudioItem } from '../types';
import { pcmToWavBlob } from '../utils/audioUtils';

interface VoiceLibraryProps {
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onAudioGenerated: (audioItem: GeneratedAudioItem) => void;
  onNavigateToStudio: () => void;
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onAudioGenerated,
  onNavigateToStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Femenino' | 'Masculino'>('ALL');
  const [auditioningVoice, setAuditioningVoice] = useState<string | null>(null);

  const filteredVoices = voices.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'ALL' || v.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const handleAudition = async (voice: VoiceInfo) => {
    setAuditioningVoice(voice.id);
    try {
      const sampleText = `Hola, mi nombre es ${voice.name}. Soy una de las voces neuronales de Gemini TTS Studio, lista para dar vida a tus proyectos.`;
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: voice.id,
          toneDirective: 'Habla con calidez, claridad y profesionalismo:',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar audición');

      const wavBlob = pcmToWavBlob(data.audioBase64, data.sampleRate || 24000);
      const audioBlobUrl = URL.createObjectURL(wavBlob);

      const newItem: GeneratedAudioItem = {
        id: `audition_${Date.now()}`,
        title: `Muestra de voz: ${voice.name}`,
        text: sampleText,
        voice: voice.id,
        voiceName: voice.name,
        audioBlobUrl,
        audioBase64: data.audioBase64,
        mimeType: 'audio/wav',
        sampleRate: data.sampleRate || 24000,
        createdAt: Date.now(),
        type: 'single',
        toneLabel: 'Muestra Oficial',
      };

      onAudioGenerated(newItem);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAuditioningVoice(null);
    }
  };

  return (
    <div id="voice-library" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/75 via-indigo-950/40 to-slate-900/75 backdrop-blur-md p-6 rounded-2xl border border-indigo-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BookOpen className="w-4 h-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Biblioteca de Voces Gemini
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Explora las 12 voces de Google Gemini AI. Escucha muestras instantáneas y elige el tono ideal para tus audiolibros, videos, comerciales o asistentes.
            </p>
          </div>

          <button
            onClick={onNavigateToStudio}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 self-start md:self-auto cursor-pointer"
          >
            <span>Ir al Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-slate-750/80">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, tono o etiqueta..."
            className="w-full bg-slate-950/60 backdrop-blur-sm border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-sm p-1 rounded-xl border border-slate-800/80 self-stretch sm:self-auto justify-center">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Género:
          </span>
          {(['ALL', 'Femenino', 'Masculino'] as const).map((gender) => (
            <button
              key={gender}
              onClick={() => setGenderFilter(gender)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                genderFilter === gender
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {gender === 'ALL' ? 'Todas' : gender}
            </button>
          ))}
        </div>
      </div>

      {/* Voices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isAuditioning = auditioningVoice === voice.id;

          return (
            <div
              key={voice.id}
              className={`bg-slate-900/70 backdrop-blur-md rounded-2xl border p-5 shadow-lg flex flex-col justify-between transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-950/40'
                  : 'border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${
                        voice.gender === 'Femenino'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {voice.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{voice.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                            voice.gender === 'Femenino'
                              ? 'bg-pink-950/80 text-pink-300 border border-pink-800/40'
                              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                          }`}
                        >
                          {voice.gender}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700">
                          {voice.tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Seleccionada
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
                  {voice.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80 mt-4">
                {/* Audition Button */}
                <button
                  type="button"
                  disabled={isAuditioning}
                  onClick={() => handleAudition(voice)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all disabled:opacity-50 cursor-pointer"
                  title="Escuchar saludo de prueba"
                >
                  {isAuditioning ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{isAuditioning ? 'Generando...' : 'Escuchar Muestra'}</span>
                </button>

                {/* Select Voice */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectVoice(voice.id);
                    onNavigateToStudio();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950/60 hover:bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm'
                  }`}
                >
                  Usar Voz
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
