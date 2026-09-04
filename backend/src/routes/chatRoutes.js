import { Router } from 'express';
import {
  handleChatMessage,
  handleAudioChatMessage,
  getActiveAgents,
  getChatHistory,
  clearChatHistory,
} from '../controllers/chatController.js';
import { handleGenerateVoice } from '../controllers/voiceController.js';

const router = Router();

// Listar agentes ativos para o seletor do chat
router.get('/agents', getActiveAgents);

// Histórico de Conversas Persistente (Recupera após F5 / Reload)
router.get('/chat/history/:userId', getChatHistory);
router.delete('/chat/history/:userId', clearChatHistory);

// Endpoint de Chat com RAG, Orquestração e Memória Contínua (Texto)
router.post('/chat', handleChatMessage);

// Endpoint de Chat com Áudio (Ouvir, Transcrever, RAG e Persistir no Supabase)
router.post('/chat/audio', handleAudioChatMessage);

// Endpoint de Voz Humanizada (Text-To-Speech com Cache no Supabase Storage)
router.post('/voice', handleGenerateVoice);

export default router;
