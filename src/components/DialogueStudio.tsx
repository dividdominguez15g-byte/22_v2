import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Volume2,
  RotateCw,
  Sparkles,
  ArrowUpDown,
  AlertCircle,
  Play,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { VoiceInfo, DialogueLine, GeneratedAudioItem, SpeakerConfig } from '../types';
import { SAMPLE_DIALOGUES, pcmToWavBlob } from '../utils/audioUtils';

interface DialogueStudioProps {
  voices: VoiceInfo[];
  onAudioGenerated: (audioItem: GeneratedAudioItem) => void;
}

export const DialogueStudio: React.FC<DialogueStudioProps> = ({
  voices,
  onAudioGenerated,
}) => {
  const [speaker1, setSpeaker1] = useState<SpeakerConfig>({
    name: 'Alex',
    voice: 'Puck',
  });
  const [speaker2, setSpeaker2] = useState<SpeakerConfig>({
    name: 'Elena',
    voice: 'Kore',
  });

  const [lines, setLines] = useState<DialogueLine[]>([
    {
      id: '1',
      speaker: '1',
      text: '¡Bienvenidos a nuestro podcast sobre Inteligencia Artificial!',
    },
    {
      id: '2',
      speaker: '2',
      text: 'Hola Alex, hoy exploraremos cómo Gemini puede generar voces con entonación hiperrealista.',
    },
    {
      id: '3',
      speaker: '1',
      text: 'Exactamente. ¡La capacidad de alternar entre múltiples locutores en un solo audio es asombrosa!',
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddLine = (speakerNum: '1' | '2') => {
    const newLine: DialogueLine = {
      id: Date.now().toString(),
      speaker: speakerNum,
      text: '',
    };
    setLines([...lines, newLine]);
  };

  const handleUpdateLineText = (id: string, text: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const handleToggleSpeaker = (id: string) => {
    setLines(
      lines.map((l) =>
        l.id === id ? { ...l, speaker: l.speaker === '1' ? '2' : '1' } : l
      )
    );
  };

  const handleDeleteLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleLoadSample = (sample: typeof SAMPLE_DIALOGUES[0]) => {
    setSpeaker1({ name: sample.spk1Name, voice: sample.spk1Voice });
    setSpeaker2({ name: sample.spk2Name, voice: sample.spk2Voice });
    setLines(
      sample.lines.map((l, idx) => ({
        id: `${Date.now()}_${idx}`,
        speaker: l.speaker,
        text: l.text,
      }))
    );
  };

  const handleGenerateDialogue = async () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) {
      setErrorMessage('Debes escribir al menos una línea de diálogo con texto.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/tts/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker1,
          speaker2,
          lines: validLines.map((l) => ({
            speaker: l.speaker,
            text: l.text.trim(),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al sintetizar el diálogo.');
      }

      const wavBlob = pcmToWavBlob(data.audioBase64, data.sampleRate || 24000);
      const audioBlobUrl = URL.createObjectURL(wavBlob);

      const title = `Diálogo: ${speaker1.name} & ${speaker2.name} (${validLines.length} turnos)`;

      const newItem: GeneratedAudioItem = {
        id: `dialogue_${Date.now()}`,
        title,
        text: validLines.map((l) => `${l.speaker === '1' ? speaker1.name : speaker2.name}: ${l.text}`).join('\n'),
        voice: `${speaker1.voice} + ${speaker2.voice}`,
        voiceName: `${speaker1.name} & ${speaker2.name}`,
        audioBlobUrl,
        audioBase64: data.audioBase64,
        mimeType: 'audio/wav',
        sampleRate: data.sampleRate || 24000,
        createdAt: Date.now(),
        type: 'dialogue',
        dialogueLines: validLines,
      };

      onAudioGenerated(newItem);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al conectar con la API de diálogo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="dialogue-studio" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Users className="w-4 h-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Studio de Diálogos & Podcast (Multi-Locutor)
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Crea conversaciones fluidas entre dos personajes con distintas voces y personalidades en una sola pista de audio.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs text-slate-400 font-medium mr-1">Plantillas:</span>
            {SAMPLE_DIALOGUES.map((sample) => (
              <button
                key={sample.title}
                onClick={() => handleLoadSample(sample)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-900/40 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Speaker Roles Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speaker 1 Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-sm font-semibold text-white">Locutor 1</span>
            </div>
            <span className="text-[11px] text-indigo-400 font-mono">Rol Principal</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Nombre / Personaje</label>
              <input
                type="text"
                value={speaker1.name}
                onChange={(e) => setSpeaker1({ ...speaker1, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                placeholder="Ej: Alex"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Voz Gemini</label>
              <select
                value={speaker1.voice}
                onChange={(e) => setSpeaker1({ ...speaker1, voice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender}) - {v.tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <span className="text-sm font-semibold text-white">Locutor 2</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-mono">Rol Secundario</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Nombre / Personaje</label>
              <input
                type="text"
                value={speaker2.name}
                onChange={(e) => setSpeaker2({ ...speaker2, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                placeholder="Ej: Elena"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Voz Gemini</label>
              <select
                value={speaker2.voice}
                onChange={(e) => setSpeaker2({ ...speaker2, voice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender}) - {v.tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Script Timeline Editor */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm text-white">Guión de la Conversación</span>
            <span className="text-xs text-slate-500">({lines.length} turnos)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddLine('1')}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ {speaker1.name || 'Locutor 1'}</span>
            </button>
            <button
              onClick={() => handleAddLine('2')}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ {speaker2.name || 'Locutor 2'}</span>
            </button>
          </div>
        </div>

        {/* Lines List */}
        <div className="space-y-3">
          {lines.map((line, index) => {
            const isSpk1 = line.speaker === '1';
            const speakerName = isSpk1 ? (speaker1.name || 'Locutor 1') : (speaker2.name || 'Locutor 2');
            const speakerVoice = isSpk1 ? speaker1.voice : speaker2.voice;

            return (
              <div
                key={line.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start gap-3 ${
                  isSpk1
                    ? 'bg-slate-950/70 border-indigo-900/40 hover:border-indigo-700/50'
                    : 'bg-slate-950/70 border-cyan-900/40 hover:border-cyan-700/50'
                }`}
              >
                {/* Speaker Selector Toggle */}
                <div className="flex items-center sm:flex-col justify-between sm:justify-start w-full sm:w-28 shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleSpeaker(line.id)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                      isSpk1
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-cyan-600 text-white shadow-sm'
                    }`}
                    title="Clic para alternar locutor"
                  >
                    <span className="truncate">{speakerName}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70 shrink-0 ml-1" />
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Voz: {speakerVoice}
                  </span>
                </div>

                {/* Text input */}
                <div className="flex-1 w-full">
                  <textarea
                    rows={2}
                    value={line.text}
                    onChange={(e) => handleUpdateLineText(line.id, e.target.value)}
                    placeholder={`Escribe lo que dice ${speakerName}...`}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 resize-none font-normal"
                  />
                </div>

                {/* Delete line */}
                <div className="flex sm:flex-col items-center justify-end w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={lines.length <= 1}
                    onClick={() => handleDeleteLine(line.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800/80 disabled:opacity-30 transition-all"
                    title="Eliminar turno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          id="btn-generate-dialogue-tts"
          disabled={isGenerating}
          onClick={handleGenerateDialogue}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-white" />
              <span>Sintetizando diálogo con Gemini Multi-Speaker...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Generar Audio de Diálogo Completo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
