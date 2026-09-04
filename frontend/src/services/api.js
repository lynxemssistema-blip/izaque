/**
 * Cliente de API para o Backend Hermes (Orquestrador IZAQUE)
 * Nenhuma chave de API de LLM fica exposta no Frontend.
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL !== undefined && import.meta.env.VITE_BACKEND_URL !== '')
  ? import.meta.env.VITE_BACKEND_URL
  : (import.meta.env.PROD ? '' : 'http://localhost:3001');

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
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents`);
    if (!res.ok) throw new Error('Falha ao carregar lista de especialistas');
    return await res.json();
  } catch (error) {
    console.error('❌ Erro ao buscar agentes:', error);
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
  try {
    if (!userId) return [];
    const response = await fetch(`${BACKEND_URL}/api/chat/history/${userId}`);
    if (!response.ok) throw new Error('Falha ao carregar histórico de conversas');
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de conversas:', error);
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
