export interface VoiceInfo {
  id: string;
  name: string;
  gender: 'Femenino' | 'Masculino';
  description: string;
  tag: string;
}

export interface TonePreset {
  id: string;
  label: string;
  directive: string;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  text: string;
  voice: string;
  voiceName?: string;
  audioBlobUrl: string;
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  durationSeconds?: number;
  createdAt: number;
  type: 'single' | 'dialogue';
  dialogueLines?: DialogueLine[];
  toneLabel?: string;
}

export interface DialogueLine {
  id: string;
  speaker: '1' | '2';
  text: string;
}

export interface SpeakerConfig {
  name: string;
  voice: string;
}
