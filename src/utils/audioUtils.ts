import { VoiceInfo, TonePreset } from '../types';

/**
 * Encodes raw 16-bit mono PCM bytes into a standard WAV (RIFF) Blob
 * Gemini TTS output is 24,000 Hz, 16-bit, mono PCM.
 */
export function pcmToWavBlob(base64Pcm: string, sampleRate = 24000): Blob {
  // Decode base64 to binary string
  const binaryStr = atob(base64Pcm);
  const len = binaryStr.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryStr.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings to DataView
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, 'WAVE');

  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Copy raw PCM data into data portion
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, 44);

  return new Blob([wavBytes], { type: 'audio/wav' });
}

export function downloadAudioBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export const SAMPLE_SCRIPTS = [
  {
    title: 'Bienvenida al Studio',
    category: 'Presentación',
    voice: 'Kore',
    tone: 'cheerful',
    text: '¡Hola y bienvenido a Gemini TTS Studio! Aquí puedes transformar cualquier texto en voces hiperrealistas, con entonación natural, emociones y diálogos multi-personaje con la inteligencia de Google Gemini.',
  },
  {
    title: 'Noticia Tecnológica',
    category: 'Informativo',
    voice: 'Orus',
    tone: 'serious',
    text: 'En las noticias de hoy: los modelos de inteligencia artificial multimodal han dado un salto cuántico, permitiendo la generación de voz con control de emociones, pausas expresivas y síntesis en tiempo real.',
  },
  {
    title: 'Tráiler Cinematográfico',
    category: 'Dramático',
    voice: 'Fenrir',
    tone: 'epic',
    text: 'En un mundo al borde del colapso, una sola chispa puede encender la revolución. Prepárate para descubrir la verdad que cambiará el destino de la humanidad.',
  },
  {
    title: 'Meditación y Calma',
    category: 'Relajación',
    voice: 'Zephyr',
    tone: 'calm',
    text: 'Cierra suavemente los ojos. Inhala profundamente sintiendo cómo el aire llena tus pulmones, y al exhalar, libera cualquier tensión acumulada. Este es tu momento de paz.',
  },
  {
    title: 'Cuento de Fantasía',
    category: 'Narración',
    voice: 'Aoede',
    tone: 'storyteller',
    text: 'Había una vez, en lo profundo del bosque de cristal, un reloj de arena que no medía el tiempo, sino los recuerdos de aquellos que se atrevían a soñar.',
  },
  {
    title: 'Anuncio Publicitario',
    category: 'Marketing',
    voice: 'Puck',
    tone: 'cheerful',
    text: '¿Listo para llevar tus proyectos al siguiente nivel? Descubre la nueva generación de herramientas creativas. ¡Pruébalo hoy y siente la diferencia!',
  },
];

export const SAMPLE_DIALOGUES = [
  {
    title: 'Entrevista de Podcast',
    spk1Name: 'Alex',
    spk1Voice: 'Puck',
    spk2Name: 'Elena',
    spk2Voice: 'Kore',
    lines: [
      { id: '1', speaker: '1' as const, text: '¡Bienvenidos de nuevo a Código Abierto! Hoy tenemos con nosotros a la investigadora Elena Soto.' },
      { id: '2', speaker: '2' as const, text: 'Muchas gracias Alex, es un gran placer estar aquí para charlar sobre el futuro de la voz sintética.' },
      { id: '3', speaker: '1' as const, text: 'Cuéntanos Elena, ¿qué es lo que más te emociona de las nuevas voces neuronales?' },
      { id: '4', speaker: '2' as const, text: 'Sin duda la capacidad de transmitir matices emocionales auténticos, como la calidez, la ironía y el entusiasmo.' },
    ],
  },
  {
    title: 'Asistencia y Soporte',
    spk1Name: 'Cliente',
    spk1Voice: 'Pegasus',
    spk2Name: 'Soporte',
    spk2Voice: 'Zephyr',
    lines: [
      { id: '1', speaker: '1' as const, text: 'Hola, tengo una consulta sobre la configuración de audio en mi cuenta.' },
      { id: '2', speaker: '2' as const, text: '¡Hola! Con mucho gusto te asisto. ¿Podrías indicarme qué formato de exportación estás utilizando?' },
      { id: '3', speaker: '1' as const, text: 'Estoy buscando exportar archivos en WAV a 24 kilohercios.' },
      { id: '2', speaker: '2' as const, text: 'Perfecto, esa opción está disponible directamente en el panel de descarga de audio.' },
    ],
  },
];
