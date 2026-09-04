/**
 * Cliente de API para o Backend Hermes (Orquestrador IZAQUE)
 * Nenhuma chave de API de LLM fica exposta no Frontend.
 */

import { supabase } from './supabase';

// Em desenvolvimento com proxy Vite ou em produção monólito/Nginx, rotas relativas garantem
// que celular, tablet, localhost ou IP remoto acessem o backend sem bloqueios de CORS ou portas.
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== '')
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : '';

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
 * Solicita ao Backend Hermes a sintetização ou resgate do cache de áudio da reflexão
 * @param {object} params
 * @param {string} params.text Texto da reflexão
 * @param {string} [params.messageId] Identificador da mensagem
 * @returns {Promise<{audioUrl: string, fromCache: boolean, cleanedText: string}>}
 */
export async function fetchVoiceAudio({ text, messageId }) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, messageId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao sintetizar voz da reflexão');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro na sintetização de voz:', error);
    throw error;
  }
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
    
    // Importação dinâmica do supabase client
    const { supabase } = await import('./supabase.js');
    
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

