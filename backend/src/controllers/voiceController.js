import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Remove formatações Markdown, emojis, URLs e caracteres que quebram o fluxo da fala.
 * Preserva reticências (...), vírgulas e pontos finais para pausas respiratórias naturais.
 * @param {string} text Texto bruto gerado pelo Gemini
 * @returns {string} Texto limpo otimizado para fala
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    // Remove blocos de código
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    // Remove links [texto](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove URLs soltas
    .replace(/https?:\/\/\S+/g, '')
    // Remove asteriscos e sublinhados de negrito/itálico (*, **, _, __)
    .replace(/[*_#~>]/g, '')
    // Remove marcadores de lista numerada ou bullet points no início da linha
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove emojis e símbolos visuais complexos
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Normaliza quebras de linha e espaços múltiplos
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // Garante que reticências tenham pequeno espaçamento para a pausa da API
    .replace(/\.{3,}/g, '... ')
    .trim();
}

/**
 * Síntese de voz via ElevenLabs API
 */
async function generateElevenLabsAudio(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel / Adam ou voz terapêutica

  console.log(`🎙️ [ElevenLabs TTS] Sintetizando fala humana (Voz: ${voiceId})...`);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs Error (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Síntese de voz via OpenAI TTS API
 */
async function generateOpenAIAudio(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const voice = process.env.OPENAI_VOICE || 'onyx'; // 'onyx' (profundo e acolhedor) ou 'fable' ou 'nova'

  console.log(`🎙️ [OpenAI TTS] Sintetizando fala humana (Voz: ${voice})...`);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      speed: 0.94, // Levemente desacelerado para tom terapêutico e respiração
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI TTS Error (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Fallback Natural de Áudio (Neural Speech) sem custos ou chaves de API
 */
async function generateFallbackAudio(text) {
  console.log('🎙️ [Neural Speech Fallback] Gerando áudio terapêutico sem custos via TTS...');
  const googleTTS = await import('google-tts-api');
  const chunks = await googleTTS.getAllAudioBase64(text, {
    lang: 'pt',
    slow: false,
    timeout: 10000,
    splitPunct: '.,!?:;...',
  });
  const buffers = chunks.map(c => Buffer.from(c.base64, 'base64'));
  return Buffer.concat(buffers);
}

/**
 * Controller Principal: POST /api/voice
 * 1. Limpa o texto
 * 2. Verifica se o áudio já existe em cache no Supabase Storage ('audio_cache')
 * 3. Se existir, retorna imediatamente
 * 4. Se não, sintetiza com ElevenLabs > OpenAI > Fallback, salva no Supabase e retorna a URL pública
 */
export async function handleGenerateVoice(req, res) {
  try {
    const { text, messageId } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'O texto para sintetização de voz é obrigatório.' });
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      return res.status(400).json({ error: 'Texto não possui caracteres válidos para leitura.' });
    }

    // Gera hash único do conteúdo do áudio para cache
    const textHash = crypto.createHash('sha256').update(cleanText).digest('hex').slice(0, 24);
    const fileName = `voice_${textHash}.mp3`;
    const bucketName = 'audio_cache';

    // 1. VERIFICA SE JÁ EXISTE NO CACHE DO SUPABASE STORAGE
    try {
      const { data: existingFiles } = await supabaseAdmin.storage
        .from(bucketName)
        .list('', { search: fileName });

      if (existingFiles && existingFiles.length > 0) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        console.log(`⚡ [Voice Cache Hit] Áudio resgatado do cache do Supabase: ${fileName}`);
        return res.status(200).json({
          audioUrl: publicUrlData.publicUrl,
          fromCache: true,
          cleanedText: cleanText,
        });
      }
    } catch (storageCheckErr) {
      console.warn('⚠️ Aviso ao consultar cache no Supabase Storage:', storageCheckErr.message);
    }

    // 2. SINTETIZAÇÃO DO ÁUDIO (ELEVENLABS -> OPENAI -> FALLBACK)
    let audioBuffer;

    if (process.env.ELEVENLABS_API_KEY) {
      try {
        audioBuffer = await generateElevenLabsAudio(cleanText);
      } catch (e11Err) {
        console.warn('⚠️ Falha no ElevenLabs, tentando fallback:', e11Err.message);
      }
    }

    if (!audioBuffer && process.env.OPENAI_API_KEY) {
      try {
        audioBuffer = await generateOpenAIAudio(cleanText);
      } catch (oaiErr) {
        console.warn('⚠️ Falha no OpenAI TTS, tentando fallback:', oaiErr.message);
      }
    }

    if (!audioBuffer) {
      audioBuffer = await generateFallbackAudio(cleanText);
    }

    // 3. PERSISTÊNCIA NO SUPABASE STORAGE (CACHE PERMANENTE)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('⚠️ Não foi possível salvar áudio no cache do Supabase:', uploadError.message);
    } else {
      console.log(`💾 [Voice Cache Saved] Áudio armazenado no bucket audio_cache: ${fileName}`);
    }

    // 4. RETORNA A URL PÚBLICA DO ÁUDIO
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    res.status(200).json({
      audioUrl: publicUrlData.publicUrl,
      fromCache: false,
      cleanedText: cleanText,
    });
  } catch (error) {
    console.error('❌ [Voice Error]:', error);
    res.status(500).json({
      error: 'Erro ao gerar voz humanizada da reflexão.',
      details: error.message,
    });
  }
}
