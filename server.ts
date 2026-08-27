import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy get GoogleGenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Curated voices with metadata
const PREBUILT_VOICES = [
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

// Available pre-configured emotion / style directions
const TONE_PRESETS = [
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

// 1. Voice list API
app.get('/api/tts/voices', (req, res) => {
  res.json({
    success: true,
    voices: PREBUILT_VOICES,
    presets: TONE_PRESETS,
  });
});

// 2. Single Speaker TTS API
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voice = 'Kore', toneDirective = '', language = 'es' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'El texto es obligatorio para generar el audio.' });
    }

    const ai = getGenAI();

    // Construct prompt with emotion/tone guidance
    let promptText = text.trim();
    if (toneDirective && toneDirective.trim()) {
      promptText = `${toneDirective.trim()} ${promptText}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.data);

    if (!audioPart?.inlineData?.data) {
      return res.status(500).json({
        error: 'No se pudo obtener el audio generado por Gemini. Intenta nuevamente.',
      });
    }

    const base64Audio = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || 'audio/pcm;rate=24000';

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType,
      sampleRate: 24000,
      voice,
      text: text.trim(),
      charCount: text.length,
      wordCount: text.trim().split(/\s+/).length,
    });
  } catch (error: any) {
    console.error('Error al generar TTS:', error);
    res.status(500).json({
      error: error.message || 'Error interno del servidor al sintetizar la voz.',
    });
  }
});

// 3. Multi-Speaker Dialogue / Podcast API
app.post('/api/tts/generate-dialogue', async (req, res) => {
  try {
    const { lines, speaker1 = { name: 'Locutor 1', voice: 'Kore' }, speaker2 = { name: 'Locutor 2', voice: 'Puck' } } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar al menos una línea de diálogo.' });
    }

    // Build dialogue text script formatted for Gemini multi-speaker TTS
    const scriptLines = lines.map((item: { speaker: string; text: string }) => {
      const spkName = item.speaker.trim() === '1' ? speaker1.name : speaker2.name;
      return `${spkName}: ${item.text.trim()}`;
    });

    const scriptPrompt = `TTS the following conversation between ${speaker1.name} and ${speaker2.name}:\n${scriptLines.join('\n')}`;

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: scriptPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: speaker1.name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: speaker1.voice },
                },
              },
              {
                speaker: speaker2.name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: speaker2.voice },
                },
              },
            ],
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.data);

    if (!audioPart?.inlineData?.data) {
      return res.status(500).json({
        error: 'No se pudo generar el audio del diálogo. Verifica el formato de los locutores.',
      });
    }

    res.json({
      success: true,
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
      sampleRate: 24000,
      speakers: [speaker1, speaker2],
      script: scriptLines.join('\n'),
    });
  } catch (error: any) {
    console.error('Error al generar diálogo TTS:', error);
    res.status(500).json({
      error: error.message || 'Error al generar la conversación multi-voz.',
    });
  }
});

// 4. Enhance / Rewrite script using Gemini 3.7 Flash
app.post('/api/tts/enhance-script', async (req, res) => {
  try {
    const { text, targetStyle = 'natural', language = 'es' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto no proporcionado.' });
    }

    const ai = getGenAI();

    let stylePrompt = '';
    switch (targetStyle) {
      case 'dramatic':
        stylePrompt = 'Reescribe el texto para que suene emocionante, cinematográfico y lleno de suspenso.';
        break;
      case 'professional':
        stylePrompt = 'Optimiza el texto para que suene formal, corporativo, claro y conciso como un informe ejecutivo.';
        break;
      case 'conversational':
        stylePrompt = 'Haz que el texto suene muy natural, coloquial, amigable y fluido para un podcast casual.';
        break;
      case 'story':
        stylePrompt = 'Embellece el texto con ritmo poético y pausas expresivas ideales para ser narradas como un cuento.';
        break;
      case 'punctuated':
        stylePrompt = 'Agrega signos de puntuación cuidadosos (comas, puntos suspensivos, exclamaciones) para guiar la entonación y pausas naturales del motor de voz.';
        break;
      default:
        stylePrompt = 'Mejora la fluidez fonética, cadencia y naturalidad del texto para lectura en voz alta.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Eres un director de locución profesional. ${stylePrompt}
Texto original:
"""${text}"""

Instrucciones:
- Devuelve ÚNICAMENTE el texto mejorado y optimizado para ser leído por un actor de voz.
- No incluyas comentarios, explicaciones, encabezados ni comillas adicionales.
- Mantén el idioma original o el solicitado (${language}).`,
    });

    res.json({
      success: true,
      enhancedText: response.text?.trim() || text,
    });
  } catch (error: any) {
    console.error('Error al optimizar guión:', error);
    res.status(500).json({
      error: error.message || 'Error al optimizar el guión.',
    });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini TTS Studio corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
