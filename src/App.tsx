import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SingleSpeakerStudio } from './components/SingleSpeakerStudio';
import { DialogueStudio } from './components/DialogueStudio';
import { VoiceLibrary } from './components/VoiceLibrary';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceInfo, TonePreset, GeneratedAudioItem } from './types';
import { pcmToWavBlob } from './utils/audioUtils';

// Fallback initial voices in case server fetch takes a moment
const DEFAULT_VOICES: VoiceInfo[] = [
  { id: 'Kore', name: 'Kore', gender: 'Femenino', description: 'Cálida, clara, serena y empática. Excelente para narraciones y audiolibros.', tag: 'Recomendada' },
  { id: 'Puck', name: 'Puck', gender: 'Masculino', description: 'Enérgico, dinámico, juvenil y cercano. Ideal para explicaciones y anuncios.', tag: 'Popular' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Femenino', description: 'Suave, articulada, profesional y tranquila. Perfecta para asistentes y meditación.', tag: 'Suave' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Masculino', description: 'Profundo, autoritario, firme y cinematográfico. Ideal para trailers e historias épicas.', tag: 'Profundo' },
  { id: 'Charon', name: 'Charon', gender: 'Masculino', description: 'Grave, misterioso, reflexivo y maduro. Excelente para documentales y suspenso.', tag: 'Misterioso' },
  { id: 'Aoede', name: 'Aoede', gender: 'Femenino', description: 'Melódica, expresiva, dulce y fluida. Ideal para cuentos y educación.', tag: 'Expresiva' },
  { id: 'Enif', name: 'Enif', gender: 'Masculino', description: 'Claro, neutro, corporativo y fluido. Ideal para e-learning y podcasts.', tag: 'Corporativo' },
  { id: 'Leda', name: 'Leda', gender: 'Femenino', description: 'Jovial, alegre, brillante y entusiasta. Ideal para marketing y redes sociales.', tag: 'Alegre' },
  { id: 'Orus', name: 'Orus', gender: 'Masculino', description: 'Resonante, sobrio, equilibrado y confiable. Perfecto para noticias e informes.', tag: 'Informativo' },
  { id: 'Pegasus', name: 'Pegasus', gender: 'Masculino', description: 'Cálido, casual, amigable y conversacional. Excelente para asistentes personales.', tag: 'Amigable' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'Femenino', description: 'Elegante, pausada, sofisticada y distinguida.', tag: 'Elegante' },
  { id: 'Vega', name: 'Vega', gender: 'Femenino', description: 'Moderna, fresca, directa y segura de sí misma.', tag: 'Moderna' },
];

const DEFAULT_PRESETS: TonePreset[] = [
  { id: 'neutral', label: 'Neutral / Estándar', directive: '' },
  { id: 'cheerful', label: 'Alegre y entusiasta', directive: 'Say cheerfully and enthusiastically with an upbeat energy: ' },
  { id: 'calm', label: 'Calmado y relajante', directive: 'Say in a very calm, gentle, peaceful and soothing voice: ' },
  { id: 'storyteller', label: 'Narrador de cuentos', directive: 'Read like an engaging, captivating dramatic storyteller: ' },
  { id: 'whisper', label: 'Susurro suave (ASMR)', directive: 'Whisper softly and intimately: ' },
  { id: 'serious', label: 'Noticiero / Profesional', directive: 'Speak clearly in a formal, authoritative, broadcast journalism news anchor tone: ' },
  { id: 'epic', label: 'Trailer épico de cine', directive: 'Read dramatically with intense gravitas like a blockbuster movie trailer narrator: ' },
  { id: 'spanish_native', label: 'Español Natural y Fluido', directive: 'Habla en un español impecable, natural, fluido y expresivo: ' },
  { id: 'friendly_tutor', label: 'Profesor / Tutor cercano', directive: 'Explain warmly, patiently and encouragingly like an inspiring teacher: ' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'dialogue' | 'voices' | 'history'>('single');
  const [voices, setVoices] = useState<VoiceInfo[]>(DEFAULT_VOICES);
  const [presets, setPresets] = useState<TonePreset[]>(DEFAULT_PRESETS);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudioItem | null>(null);
  const [history, setHistory] = useState<GeneratedAudioItem[]>([]);
  const [customBg, setCustomBg] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gemini_tts_custom_bg') || null;
    } catch {
      return null;
    }
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gemini_tts_bg_opacity');
      return saved ? parseFloat(saved) : 0.3;
    } catch {
      return 0.3;
    }
  });

  const handleUpdateBg = (base64OrUrl: string | null) => {
    setCustomBg(base64OrUrl);
    try {
      if (base64OrUrl) {
        localStorage.setItem('gemini_tts_custom_bg', base64OrUrl);
      } else {
        localStorage.removeItem('gemini_tts_custom_bg');
      }
    } catch (err) {
      console.warn('Almacenando fondo solo en memoria:', err);
    }
  };

  const handleUpdateBgOpacity = (opacity: number) => {
    setBgOpacity(opacity);
    try {
      localStorage.setItem('gemini_tts_bg_opacity', opacity.toString());
    } catch (err) {
      console.warn('Error al guardar opacidad:', err);
    }
  };

  // Load voices from API
  useEffect(() => {
    fetch('/api/tts/voices')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices) setVoices(data.voices);
        if (data.presets) setPresets(data.presets);
      })
      .catch((err) => console.warn('Usando voces locales:', err));
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gemini_tts_history');
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        // Reconstruct Blob URLs from base64
        const restored: GeneratedAudioItem[] = parsed.map((item) => {
          const wavBlob = pcmToWavBlob(item.audioBase64, item.sampleRate || 24000);
          const audioBlobUrl = URL.createObjectURL(wavBlob);
          return {
            ...item,
            audioBlobUrl,
          };
        });
        setHistory(restored);
        if (restored.length > 0) {
          setCurrentAudio(restored[0]);
        }
      }
    } catch (e) {
      console.warn('Error al restaurar historial:', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (items: GeneratedAudioItem[]) => {
    setHistory(items);
    try {
      // Store without blob URLs to save storage
      const toStore = items.slice(0, 20).map(({ audioBlobUrl, ...rest }) => rest);
      localStorage.setItem('gemini_tts_history', JSON.stringify(toStore));
    } catch (e) {
      console.warn('Error al guardar en localStorage:', e);
    }
  };

  const handleAudioGenerated = (newItem: GeneratedAudioItem) => {
    setCurrentAudio(newItem);
    const updated = [newItem, ...history.filter((h) => h.id !== newItem.id)];
    saveHistory(updated);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (currentAudio?.id === id) {
      setCurrentAudio(updated[0] || null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setCurrentAudio(null);
    localStorage.removeItem('gemini_tts_history');
  };

  const handlePlayFromHistory = (item: GeneratedAudioItem) => {
    setCurrentAudio(item);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-32 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Background Wallpaper Layer */}
      {customBg && (
        <div 
          id="custom-app-background-layer"
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src={customBg}
            alt="Fondo Personalizado"
            className="w-full h-full object-cover object-center transition-opacity duration-300 ease-in-out"
            style={{ opacity: bgOpacity }}
          />
          {/* Subtle dimming to ensure pristine contrast and text legibility */}
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />
        </div>
      )}

      {/* Navigation Header */}
      <div className="relative z-20">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          historyCount={history.length}
          customBg={customBg}
          bgOpacity={bgOpacity}
          onUpdateBg={handleUpdateBg}
          onUpdateBgOpacity={handleUpdateBgOpacity}
        />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'single' && (
          <SingleSpeakerStudio
            voices={voices}
            presets={presets}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            onAudioGenerated={handleAudioGenerated}
          />
        )}

        {activeTab === 'dialogue' && (
          <DialogueStudio
            voices={voices}
            onAudioGenerated={handleAudioGenerated}
          />
        )}

        {activeTab === 'voices' && (
          <VoiceLibrary
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            onAudioGenerated={handleAudioGenerated}
            onNavigateToStudio={() => setActiveTab('single')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryDrawer
            history={history}
            onPlayItem={handlePlayFromHistory}
            onDeleteItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            currentPlayingId={currentAudio?.id}
          />
        )}
      </main>

      {/* Global Persistent Bottom Audio Player with Visualizer */}
      <AudioPlayer
        currentAudio={currentAudio}
        onClear={() => setCurrentAudio(null)}
      />
    </div>
  );
}
