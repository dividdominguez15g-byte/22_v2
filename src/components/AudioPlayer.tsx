import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Sparkles,
  Radio,
  Sliders,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types';
import { downloadAudioBlob } from '../utils/audioUtils';

interface AudioPlayerProps {
  currentAudio: GeneratedAudioItem | null;
  onClear?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentAudio,
  onClear,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // When currentAudio changes, reset and autoplay
  useEffect(() => {
    if (!currentAudio || !audioRef.current) return;
    audioRef.current.src = currentAudio.audioBlobUrl;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.loop = isLooping;
    audioRef.current.load();

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentAudio]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Handle Time updates
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (audioRef.current) {
      audioRef.current.loop = nextLoop;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : val;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.volume = nextMute ? 0 : volume;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!currentAudio) return;
    fetch(currentAudio.audioBlobUrl)
      .then(res => res.blob())
      .then(blob => {
        const filename = `${currentAudio.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'gemini_tts'}.wav`;
        downloadAudioBlob(blob, filename);
      })
      .catch(err => console.error('Error al descargar:', err));
  };

  // Waveform Canvas Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const renderVisualizer = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 36;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isPlaying) {
          // Dynamic simulated frequency animation when playing
          const wave = Math.sin(frame * 0.08 + i * 0.4) * Math.cos(frame * 0.04 + i * 0.2);
          barHeight = Math.max(4, Math.abs(wave) * (canvas.height * 0.85));
        } else {
          barHeight = 4 + (Math.sin(i * 0.5) + 1) * 3;
        }

        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#818cf8'); // indigo-400
          gradient.addColorStop(0.5, '#6366f1'); // indigo-500
          gradient.addColorStop(1, '#38bdf8'); // sky-400
        } else {
          gradient.addColorStop(0, '#475569');
          gradient.addColorStop(1, '#334155');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  if (!currentAudio) {
    return null;
  }

  return (
    <div
      id="global-audio-player"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur-xl border-t border-indigo-500/30 text-white shadow-2xl shadow-indigo-950/80 transition-all"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Track Info & Voice */}
          <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
              <Radio className={`w-5 h-5 text-white ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate text-slate-100">
                  {currentAudio.title || 'Audio sintetizado'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-medium shrink-0 border border-indigo-500/30">
                  {currentAudio.voiceName || currentAudio.voice}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {currentAudio.text}
              </p>
            </div>
          </div>

          {/* Center: Controls & Scrubber & Visualizer */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
            <div className="flex items-center gap-4">
              {/* Playback speed buttons */}
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
                {[0.75, 1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      playbackRate === rate
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Play / Pause button */}
              <button
                id="btn-play-pause"
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Loop toggle */}
              <button
                id="btn-loop-toggle"
                onClick={toggleLoop}
                className={`p-2 rounded-lg transition-all ${
                  isLooping
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isLooping ? 'Repetición activada' : 'Repetir audio'}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber Bar & Visualizer */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center">
                {/* Visualizer Canvas behind scrubber */}
                <canvas
                  ref={canvasRef}
                  width={240}
                  height={20}
                  className="absolute inset-0 w-full h-5 pointer-events-none opacity-40"
                />

                <input
                  id="audio-scrubber-range"
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="relative z-10 w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />
              </div>

              <span className="text-[11px] font-mono text-slate-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Volume & Export */}
          <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <button
                onClick={toggleMute}
                className="hover:text-slate-200 p-1"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Download WAV */}
            <button
              id="btn-download-wav"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
              title="Descargar archivo .WAV a 24 kHz"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Descargar WAV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
