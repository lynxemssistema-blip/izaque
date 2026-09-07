/**
 * Cliente de API para o Backend Hermes (Orquestrador IZAQUE)
 * Nenhuma chave de API de LLM fica exposta no Frontend.
 */

import { supabase } from './supabase';

// Em desenvolvimento com proxy Vite ou em produção monólito/Nginx, rotas relativas garantem
// que celular, tablet, localhost ou IP remoto acessem o backend sem bloqueios de CORS ou portas.
function resolveBackendUrl() {
  if (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== '') {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
  }

  // Se estiver rodando localmente em uma porta estática sem proxy Vite (ex: Live Server 5500 ou preview direto)
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocal && port && port !== '5173' && port !== '4173' && port !== '3001') {
      return 'http://localhost:3001';
    }
  }

  return '';
}

const BACKEND_URL = resolveBackendUrl();

/**
 * Remove formatações Markdown, emojis, URLs e caracteres que quebram o fluxo da fala.
 * Otimizado para entonação calma e meditativa do santuário.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#~>]/g, '')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{3,}/g, '... ')
    .trim();
}

/**
 * Calcula o hash SHA-256 do texto para verificação de cache no Supabase Storage
 */
export async function getCleanTextAndHash(text, voiceName = 'Charon') {
  const clean = cleanTextForSpeech(text);
  if (!clean) return { cleanText: '', fileName: '' };
  try {
    const normalizedVoice = (voiceName || 'Charon').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${normalizedVoice}_${clean}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const fileName = `voice_${normalizedVoice}_${hashHex.slice(0, 24)}.wav`;
      return { cleanText: clean, fileName };
    }
    return { cleanText: clean, fileName: '' };
  } catch {
    return { cleanText: clean, fileName: '' };
  }
}

/**
 * Converte resposta da API para JSON com validação segura de Content-Type.
 * Evita que páginas HTML de servidores estáticos quebrem a aplicação com "Unexpected token <".
 */
async function safeParseJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const textSnippet = await response.text().catch(() => '');
    if (textSnippet.includes('<!doctype') || textSnippet.includes('<html')) {
      throw new Error(
        `O servidor web estático respondeu com HTML (index.html). O Backend Hermes Node.js precisa estar rodando ou configurado em VITE_BACKEND_URL.`
      );
    }
    throw new Error(`Resposta não-JSON recebida da API (status ${response.status})`);
  }
  return await response.json();
}

/**
 * Envia uma mensagem para o Backend Hermes processar com RAG e Gemini
 * @param {object} params
 * @param {string} params.message Texto enviado pelo usuário
 * @param {string} params.userId ID único do usuário autenticado no Supabase
 * @param {string} [params.agentId] ID do agente/mentor selecionado (opcional)
 * @param {Array} [params.history] Histórico recente da conversa
 * @returns {Promise<{reply: string, memoriesUsed: Array, timestamp: string}>}
 */
export async function sendChatMessage({ message, userId, agentId, history = [] }) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
        agentId,
        history: history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro na comunicação com o Backend Hermes:', error);
    throw error;
  }
}

/**
 * Verifica o status de saúde do Backend
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Busca todos os agentes especialistas ativos para o seletor do chat
 */
export async function fetchActiveAgents() {
  // 1. Tenta via Backend Hermes
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch {}

  // 2. Fallback direto ao Supabase (garante que os agentes carreguem 100% mesmo com backend offline)
  try {
    const { data, error } = await supabase
      .from('izaque_agents')
      .select('id, name, slug, type, temperature, system_prompt, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('⚠️ Falha ao buscar especialistas no Supabase:', error?.message);
    return [];
  }
}

/**
 * Envia um áudio de voz para transcrição e processamento com RAG no Backend Hermes
 * @param {object} params
 * @param {string} params.audioBase64 Áudio gravado em base64
 * @param {string} [params.mimeType] Tipo MIME (ex: audio/webm, audio/wav)
 * @param {string} params.userId ID único do usuário autenticado no Supabase
 * @param {string} [params.agentId] ID do mentor especialista (ou 'auto')
 * @param {number} [params.durationSeconds] Duração do áudio gravado em segundos
 * @param {Array} [params.history] Histórico recente da conversa
 * @returns {Promise<{transcription: string, reply: string, agentUsed: object, memoriesUsed: Array, knowledgeUsed: Array, timestamp: string}>}
 */
export async function sendAudioChatMessage({ audioBase64, mimeType = 'audio/webm', userId, agentId, durationSeconds, history = [] }) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        userId,
        agentId,
        durationSeconds,
        history: history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ao processar áudio: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de áudio:', error);
    throw error;
  }
}

/**
 * Solicita ao Backend Hermes a sintetização ou resgate do cache de áudio da reflexão.
 * Se o backend estiver offline ou retornar 404 (ex: em hospedagem estática/VPS sem proxy),
 * busca diretamente no cache do Supabase Storage ou ativa a Web Speech API nativa.
 * @param {object} params
 * @param {string} params.text Texto da reflexão
 * @param {string} [params.voiceName] Nome da voz (Charon, Aoede, Kore, etc.)
 * @returns {Promise<{audioUrl: string|null, fromCache: boolean, cleanedText: string, useSpeechSynthesis: boolean, voiceName?: string}>}
 */
export async function fetchVoiceAudio({ text, messageId, voiceName = 'Charon' }) {
  const { cleanText, fileName } = await getCleanTextAndHash(text, voiceName);
  if (!cleanText) {
    throw new Error('Texto não possui caracteres válidos para leitura.');
  }

  // 1. Tenta sintetizar via Backend Hermes (Gemini TTS -> ElevenLabs -> OpenAI -> Google TTS)
  try {
    const response = await fetch(`${BACKEND_URL}/api/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, messageId, voiceName }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data?.audioUrl) {
          return {
            audioUrl: data.audioUrl,
            fromCache: Boolean(data.fromCache),
            cleanedText: cleanText,
            useSpeechSynthesis: false,
            voiceName: data.voiceName || voiceName,
          };
        }
      }
    }
  } catch (backendErr) {
    console.warn('⚠️ [Voice] Backend /api/voice indisponível, buscando alternativas:', backendErr?.message);
  }

  // 2. FALLBACK 1: Verifica diretamente no Supabase Storage se o áudio já foi gerado e salvo em cache
  if (fileName) {
    try {
      const { data: publicUrlData } = supabase.storage
        .from('audio_cache')
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        const headCheck = await fetch(publicUrlData.publicUrl, { method: 'HEAD' }).catch(() => null);
        if (headCheck && headCheck.ok) {
          console.log('⚡ [Voice Cache Hit] Áudio encontrado diretamente no Supabase Storage:', fileName);
          return {
            audioUrl: publicUrlData.publicUrl,
            fromCache: true,
            cleanedText: cleanText,
            useSpeechSynthesis: false,
          };
        }
      }
    } catch (storageErr) {
      console.warn('⚠️ [Voice] Verificação direta de cache no Supabase Storage indisponível:', storageErr?.message);
    }
  }

  // 3. FALLBACK 2: Se não houver áudio pré-gerado e o backend não responder (404/offline),
  // aciona a síntese de voz nativa do navegador (Web Speech API pt-BR) para voz sem interrupção
  return {
    audioUrl: null,
    fromCache: false,
    cleanedText: cleanText,
    useSpeechSynthesis: true,
  };
}

/**
 * Busca todo o histórico de conversas do usuário no Supabase para persistência após recarregar a página
 * @param {string} userId ID único do usuário
 * @returns {Promise<Array<{id: string, role: string, content: string, isVoice: boolean, durationSeconds: number, timestamp: string}>>}
 */
export async function fetchChatHistory(userId) {
  if (!userId) return [];

  // 1. Tenta buscar via Backend Hermes
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/history/${userId}`);
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch {}

  // 2. FALLBACK DIRETO AO BANCO SUPABASE: Garante que as mensagens do usuário
  // carreguem 100% diretamente da nuvem, mesmo sem o backend Node ativo na VPS!
  try {
    const { data: messages, error } = await supabase
      .from('izaque_messages')
      .select('id, role, content, is_audio, audio_duration_seconds, created_at, izaque_agents(id, name, slug, type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.warn('⚠️ Erro ao consultar Supabase izaque_messages:', error.message);
      return [];
    }

    return (messages || []).map((msg) => ({
      id: msg.id,
      role: msg.role === 'assistant' ? 'guide' : 'user',
      content: msg.content,
      isVoice: Boolean(msg.is_audio),
      durationSeconds: msg.audio_duration_seconds || 0,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(msg.created_at).toLocaleDateString('pt-BR'),
      created_at: msg.created_at,
      agentUsed: msg.izaque_agents ? {
        id: msg.izaque_agents.id,
        name: msg.izaque_agents.name,
        slug: msg.izaque_agents.slug,
        type: msg.izaque_agents.type,
      } : null,
    }));
  } catch (err) {
    console.warn('⚠️ Falha ao buscar histórico persistido do Supabase:', err?.message);
    return [];
  }
}

/**
 * Limpa o histórico de conversas do usuário caso deseje reiniciar a sessão
 * @param {string} userId ID único do usuário
 */
export async function clearChatHistory(userId) {
  try {
    if (!userId) return;
    const response = await fetch(`${BACKEND_URL}/api/chat/history/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao limpar histórico');
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    throw error;
  }
}

/**
 * Atualiza os dados de perfil do usuário (nome, telefone/WhatsApp, foto/avatar)
 * @param {string} userId
 * @param {{full_name?: string, phone?: string, avatar_url?: string}} profileData
 */
export async function updateUserProfile(userId, profileData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar dados de perfil');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil via API:', error);
    throw error;
  }
}

/**
 * Upload de foto de perfil/avatar para o Supabase Storage (bucket avatars)
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} URL pública da foto
 */
export async function uploadUserAvatar(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    // Usa o import estático do topo do arquivo (evita aviso de chunk conflitante no Vite)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro ao fazer upload de foto de perfil:', error);
    throw error;
  }
}

/**
 * Solicita o envio do e-mail de recuperação de senha via suporte@lynxems.com.br
 * @param {string} email
 * @returns {Promise<{message: string, sentTo?: string}>}
 */
export async function requestPasswordReset(email) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao processar recuperação de senha.');
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao solicitar recuperação de senha:', error);
    throw error;
  }
}

/**
 * Busca planos ativos disponíveis para o cliente
 */
export async function fetchPublicPlans() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/plans`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  // Fallback direto ao Supabase
  const { data, error } = await supabase
    .from('izaque_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Cria um pedido de assinatura PIX
 */
export async function createPixOrder({ planId, userId, userEmail, userName }) {
  const res = await fetch(`${BACKEND_URL}/api/subscription/pix-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, userId, userEmail, userName }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao processar pedido PIX.');
  }

  return data;
}

/**
 * Envia sugestão, reclamação ou pedido de suporte do assinante
 */
export async function sendSubscriberFeedback({ userId, userEmail, userName, type, subject, message }) {
  const res = await fetch(`${BACKEND_URL}/api/subscription/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userEmail, userName, type, subject, message }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao enviar mensagem ao suporte.');
  }

  return data;
}

/**
 * Consulta dados e status de assinatura do usuário
 */
export async function fetchUserSubscriptionStatus(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/subscription/status/${userId}`);
    if (res.ok) return await res.json();
  } catch {}

  const { data: profile } = await supabase
    .from('izaque_profiles')
    .select('id, plan_id, is_active, plan_status, plan_activated_at, plan_expires_at')
    .eq('id', userId)
    .single();

  return { profile, latestOrder: null };
}


