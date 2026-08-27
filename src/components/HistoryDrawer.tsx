import React from 'react';
import {
  History,
  Play,
  Download,
  Trash2,
  Volume2,
  Calendar,
  Layers,
  Users,
  Mic,
  Copy,
  Check,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types';
import { downloadAudioBlob } from '../utils/audioUtils';

interface HistoryDrawerProps {
  history: GeneratedAudioItem[];
  onPlayItem: (item: GeneratedAudioItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  currentPlayingId?: string;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onPlayItem,
  onDeleteItem,
  onClearHistory,
  currentPlayingId,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadItem = (item: GeneratedAudioItem) => {
    fetch(item.audioBlobUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const filename = `${item.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'gemini_tts'}.wav`;
        downloadAudioBlob(blob, filename);
      })
      .catch((err) => console.error(err));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  return (
    <div id="history-view" className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/75 via-indigo-950/40 to-slate-900/75 backdrop-blur-md p-6 rounded-2xl border border-indigo-500/25 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <History className="w-4 h-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Historial de Grabaciones & Exportaciones
              </h1>
            </div>
            <p className="text-sm text-slate-300">
              Todos los audios sintetizados en esta sesión. Puedes reproducirlos, descargarlos en WAV o copiar sus guiones.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-3.5 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/70 text-red-200 text-xs font-semibold border border-red-800/60 flex items-center gap-2 backdrop-blur-sm transition-all self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Todo</span>
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Volume2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            Aún no has generado audios
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Ve al Studio de Voz Individual o al Diálogo para sintetizar tus primeros audios con Gemini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isPlaying = currentPlayingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-slate-900/70 backdrop-blur-md rounded-2xl border p-4 shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isPlaying
                    ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-950/40'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => onPlayItem(item)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Reproducir este audio"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {item.title}
                      </span>

                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          item.type === 'dialogue'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                            : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/40'
                        }`}
                      >
                        {item.type === 'dialogue' ? <Users className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        {item.type === 'dialogue' ? 'Diálogo' : 'Individual'}
                      </span>

                      {/* Voice Name */}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700">
                        {item.voiceName || item.voice}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {item.text}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span>•</span>
                      <span>24 kHz WAV</span>
                    </div>
                  </div>
                </div>

                {/* Right action buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleCopy(item.id, item.text)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs backdrop-blur-sm transition-all cursor-pointer"
                    title="Copiar texto del guión"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadItem(item)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                    title="Descargar archivo WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>WAV</span>
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-950/60 hover:text-red-300 text-slate-400 border border-slate-800 hover:border-red-800/50 text-xs backdrop-blur-sm transition-all cursor-pointer"
                    title="Eliminar de historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
