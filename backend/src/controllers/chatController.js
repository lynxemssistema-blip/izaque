import { genAI, CHAT_MODEL } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateEmbedding, searchMemories, formatMemoriesForPrompt } from '../services/memoryService.js';
import { extractAndSaveMemoryAsync } from '../services/extractionService.js';
import { transcribeAudioWithGemini } from '../services/audioService.js';

/**
 * Retorna todos os agentes especialistas ativos para o seletor da interface
 */
export async function getActiveAgents(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .select('id, name, slug, type, temperature, system_prompt, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar agentes ativos:', error);
    res.status(500).json({ error: 'Erro ao listar agentes.' });
  }
}

/**
 * Função interna para orquestrar a seleção de agente (Auto-Routing)
 * Permite ao Orquestrador Central alternar dinamicamente entre os especialistas
 * de acordo com o contexto e intenção da conversa do usuário.
 */
async function resolveAgent(agentId, userMessage, allAgents, history = []) {
  const masterAgent = allAgents?.find(a => a.slug === 'izaque-master') || {
    id: 'default',
    name: 'IZAQUE - Arquiteto da Mentalidade',
    slug: 'izaque-master',
    type: 'mindset',
    system_prompt: 'Você é IZAQUE, mentor de alta performance especialista em reprogramação de mentalidade, identificação de bloqueios emocionais e superação de autossabotagem.',
    temperature: 0.70,
  };

  // Se o usuário especificou um especialista fixo diferente de 'auto'
  if (agentId && agentId !== 'auto') {
    const found = allAgents?.find(a => a.id === agentId || a.slug === agentId);
    if (found) return found;
  }

  // Heurística rápida de intenção direta para resposta ágil e certeira
  const lowerMsg = (userMessage || '').toLowerCase();

  // 1. Termos Bíblicos / Fé / Deus / Espiritualidade (Pastor João)
  const biblicalTerms = [
    'deus', 'bíblia', 'biblia', 'versículo', 'versiculo', 'versículos', 'versiculos',
    'pastor', 'oração', 'oracao', 'orar', 'senhor', 'fé', 'jesus', 'cristão', 'evangélico',
    'salmo', 'escritura', 'palavra de deus', 'evangelho', 'joão ferreira de almeida', 'igreja'
  ];
  const isBiblicalIntent = biblicalTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isBiblicalIntent) {
    const biblicalAgent = allAgents?.find(a => a.slug === 'pastor-joao-biblico' || a.type === 'espiritualidade');
    if (biblicalAgent) {
      console.log(`🧭 [IZAQUE Router] Intenção bíblica/espiritual detectada -> Direcionado para: "${biblicalAgent.name}"`);
      return biblicalAgent;
    }
  }

  // 2. Termos Financeiros / Escassez / Dinheiro (Dr. Marcus)
  const financeTerms = [
    'dinheiro', 'cobrar', 'preço', 'preco', 'precificar', 'precificação', 'escassez',
    'faturamento', 'financeiro', 'lucro', 'falência', 'falencia', 'enriquecer', 'rico', 'riqueza'
  ];
  const isFinanceIntent = financeTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isFinanceIntent) {
    const financeAgent = allAgents?.find(a => a.slug === 'mentor-financeiro' || a.type === 'financeiro');
    if (financeAgent) {
      console.log(`🧭 [IZAQUE Router] Intenção financeira detectada -> Direcionado para: "${financeAgent.name}"`);
      return financeAgent;
    }
  }

  // 3. Termos de Liderança / Delegação / Centralização (Helena Vance)
  const leadershipTerms = [
    'delegar', 'delegação', 'delegacao', 'minha equipe', 'meus funcionários', 'funcionarios',
    'centralizar', 'centralizo', 'centralização', 'centralizacao', 'controlar tudo', 'liderança', 'lideranca'
  ];
  const isLeadershipIntent = leadershipTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isLeadershipIntent) {
    const leadershipAgent = allAgents?.find(a => a.slug === 'mentora-lideranca' || a.type === 'lideranca');
    if (leadershipAgent) {
      console.log(`🧭 [IZAQUE Router] Intenção de liderança detectada -> Direcionado para: "${leadershipAgent.name}"`);
      return leadershipAgent;
    }
  }

  // 4. Auto-Roteamento Inteligente via Gemini (Contexto Multi-Turno)
  if (allAgents && allAgents.length > 1) {
    try {
      const recentTurns = (history || [])
        .slice(-3)
        .map(h => `${h.role === 'user' ? 'Usuário' : 'Guia'}: "${(h.content || '').slice(0, 140)}"`)
        .join('\n');

      const routerPrompt = `
Você é o Orquestrador Central da Mentoria "IZAQUE".
Sua função é analisar a mensagem do usuário e o contexto da conversa para decidir qual Especialista é o mais indicado para responder e acolher o desabafo.

ESPECIALISTAS DA MENTORIA:
${allAgents.map(a => `- ID: ${a.id} | Slug: ${a.slug} | Nome: ${a.name} | Especialidade: ${a.type}
  Foco: ${a.slug === 'pastor-joao-biblico' ? 'Bíblia Sagrada (JFA), fé em Deus, oração, versículos, angústia espiritual, colocando Deus sempre em primeiro lugar.' : a.slug === 'mentor-financeiro' ? 'Mentalidade financeira, crenças de escassez, culpa com dinheiro, precificação e prosperidade.' : a.slug === 'mentora-lideranca' ? 'Liderança, delegação, cura da centralização e medo de confiar na equipe.' : 'Reprogramação de mentalidade geral, autossabotagem, desabafos emocionais e acolhimento amplo.'}`).join('\n')}

${recentTurns ? `HISTÓRICO RECENTE:\n${recentTurns}\n` : ''}
MENSAGEM DO USUÁRIO: "${userMessage}"

DIRETRIZES:
- Se envolver fé, Deus, versículos bíblicos, oração, desânimo da alma: selecione o especialista bíblico (${allAgents.find(a => a.slug === 'pastor-joao-biblico')?.id || 'pastor-joao-biblico'}).
- Se envolver dinheiro, preços, culpa por ter dinheiro ou lucro: selecione o especialista financeiro.
- Se envolver delegar, controle, desconfiança de equipe: selecione a especialista de liderança.
- Se for geral, autossabotagem, desabafo emocional amplo: selecione o IZAQUE Master (${masterAgent.id}).

Retorne EXCLUSIVAMENTE o ID ou Slug do especialista escolhido. Não inclua explicações ou texto extra.`;

      const routerModel = genAI.getGenerativeModel({
        model: CHAT_MODEL,
        generationConfig: { temperature: 0.1 },
      });
      const routerResult = await routerModel.generateContent(routerPrompt);
      const chosenText = routerResult.response.text().trim();

      // Busca por ID exato, slug exato, ou substring limpa
      let autoPicked = allAgents.find(a => a.id === chosenText || a.slug === chosenText);
      if (!autoPicked) {
        autoPicked = allAgents.find(a => chosenText.includes(a.id) || (a.slug && chosenText.includes(a.slug)));
      }

      if (autoPicked) {
        console.log(`🧭 [IZAQUE Router] Direcionado via IA para: "${autoPicked.name}" (${autoPicked.slug})`);
        return autoPicked;
      }
    } catch (err) {
      console.warn('⚠️ Falha no auto-roteamento via IA, usando IZAQUE Master:', err.message);
    }
  }

  return masterAgent;
}

/**
 * Executa a orquestração completa: RAG de memórias, super-prompt e Gemini
 */
async function processChatMessageCore({ message, userId, agentId, history = [] }) {
  const { data: allActiveAgents } = await supabaseAdmin
    .from('izaque_agents')
    .select('id, name, slug, type, system_prompt, temperature')
    .eq('is_active', true);

  const selectedAgent = await resolveAgent(agentId, message, allActiveAgents || [], history);

  // 1. Gera Embedding da mensagem (768d)
  const userEmbedding = await generateEmbedding(message);

  // 2. Busca memórias semânticas no Supabase pgvector (Histórico do Usuário)
  const relevantMemories = await searchMemories(userId, userEmbedding, {
    matchThreshold: 0.40,
    matchCount: 4,
  });
  const memoriesText = formatMemoriesForPrompt(relevantMemories);

  // 3. Busca estudos e materiais técnicos do Agente (Base de Conhecimento RAG de Domínio)
  let knowledgeText = '';
  let relevantKnowledge = [];
  try {
    const { searchAgentKnowledge, formatAgentKnowledgeForPrompt } = await import('../services/agentKnowledgeService.js');
    relevantKnowledge = await searchAgentKnowledge(selectedAgent.id, userEmbedding, {
      matchThreshold: 0.38,
      matchCount: 3,
    });
    knowledgeText = formatAgentKnowledgeForPrompt(relevantKnowledge);
  } catch (kErr) {
    console.warn('⚠️ Falha ao buscar conhecimento de estudo do agente:', kErr.message);
  }

  // 4. Monta o Super-Prompt com Persona + Conhecimento Técnico + Memórias Pessoais
  const fullSystemInstruction = `${selectedAgent.system_prompt}

${knowledgeText}

${memoriesText}

DIRETRIZES DO IZAQUE (OTIMIZADO PARA FALA HUMANA E ACOLHIMENTO):
1. Sua resposta será lida em voz alta por uma voz humana empática. NUNCA use listas com marcadores (* ou -), tópicos enumerados, emojis ou formatação Markdown excessiva.
2. Escreva de forma conversacional, em parágrafos curtos, calorosos e fluidos.
3. USE RETICÊNCIAS (...) estrategicamente para forçar pausas respiratórias e dramáticas na fala. Aja como um mentor com voz mansa e acolhedora.
4. Confronte desculpas confortáveis, exponha o padrão de autossabotagem e acolha a dor real.
5. Aplique com autoridade os conceitos da sua base de estudos e integre memórias de longo prazo do usuário com naturalidade.
6. Conclua com uma reflexão profunda ou um passo prático para as próximas 24 horas.`;

  // 4. Sanitiza o histórico de chat para o Gemini:
  // Gemini exige estritamente que a primeira mensagem seja 'user' e que haja alternância de papéis
  const rawHistory = history.slice(-8).map((h) => ({
    role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.content || h.parts?.[0]?.text || '' }],
  })).filter(h => h.parts[0].text && h.parts[0].text.trim().length > 0);

  const recentHistory = [];
  const firstUserIdx = rawHistory.findIndex(h => h.role === 'user');

  if (firstUserIdx !== -1) {
    for (let i = firstUserIdx; i < rawHistory.length; i++) {
      const current = rawHistory[i];
      const prev = recentHistory[recentHistory.length - 1];
      if (!prev || prev.role !== current.role) {
        recentHistory.push(current);
      }
    }
  }

  // 5. Gera a resposta com Gemini
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: fullSystemInstruction,
    generationConfig: {
      temperature: Number(selectedAgent.temperature) || 0.7,
      maxOutputTokens: 1500,
    },
  });

  const chatSession = model.startChat({ history: recentHistory });
  const result = await chatSession.sendMessage(message);
  const replyText = result.response.text();

  // 6. Extração assíncrona de novos bloqueios em background
  extractAndSaveMemoryAsync(userId, message, replyText);

  return {
    reply: replyText,
    selectedAgent,
    relevantMemories,
    relevantKnowledge,
  };
}

/**
 * Controller do Chat de Texto Padrão
 */
export async function handleChatMessage(req, res) {
  try {
    const { message, userId, agentId, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'O campo "message" é obrigatório.' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'O campo "userId" é obrigatório.' });
    }

    const { reply, selectedAgent, relevantMemories, relevantKnowledge } = await processChatMessageCore({
      message,
      userId,
      agentId,
      history,
    });

    // Salva mensagem de texto no banco de dados (histórico em izaque_messages)
    try {
      const isAgentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAgent?.id || '');
      const safeAgentId = isAgentUuid ? selectedAgent.id : null;

      await supabaseAdmin.from('izaque_messages').insert([
        { user_id: userId, agent_id: safeAgentId, role: 'user', content: message, is_audio: false },
        { user_id: userId, agent_id: safeAgentId, role: 'assistant', content: reply, is_audio: false },
      ]);
    } catch (dbErr) {
      console.warn('⚠️ Aviso ao persistir mensagens em izaque_messages:', dbErr.message);
    }

    res.status(200).json({
      reply,
      agentUsed: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        slug: selectedAgent.slug,
        type: selectedAgent.type,
      },
      memoriesUsed: (relevantMemories || []).map(m => ({
        content: m.content,
        category: m.category,
        similarity: m.similarity,
      })),
      knowledgeUsed: (relevantKnowledge || []).map(k => ({
        content: k.content,
        similarity: k.similarity,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [IZAQUE Chat] Erro ao processar mensagem:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem.', details: error.message });
  }
}

/**
 * Controller de Mensagem de ÁUDIO:
 * 1. Ouve e transcreve o áudio com Gemini Multimodal
 * 2. Salva a transcrição no banco de dados (izaque_messages)
 * 3. Processa a resposta com RAG e Mentor Especialista
 * 4. Retorna a transcrição e a resposta para o frontend
 */
export async function handleAudioChatMessage(req, res) {
  try {
    const { audioBase64, mimeType = 'audio/webm', userId, agentId, history = [], durationSeconds } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'O áudio em formato base64 é obrigatório.' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'O campo "userId" é obrigatório.' });
    }

    console.log(`\n🎙️ [Audio Chat] Novo áudio recebido do usuário [${userId}] (${mimeType}). Iniciando transcrição...`);

    // 1. OUVIR E TRANSCREVER O ÁUDIO COM O GEMINI
    const transcription = await transcribeAudioWithGemini(audioBase64, mimeType);

    if (!transcription || transcription === '[Áudio inaudível]') {
      return res.status(200).json({
        transcription: '[Áudio inaudível]',
        reply: 'Não consegui compreender nitidamente o que você disse no áudio. Pode gravar novamente ou digitar a sua mensagem?',
        agentUsed: { name: 'IZAQUE - Arquiteto da Mentalidade', type: 'mindset' },
        memoriesUsed: [],
        knowledgeUsed: [],
        timestamp: new Date().toISOString(),
      });
    }

    // 2. PROCESSAR O CONTEÚDO TRANSCRITO NO PIPELINE DO MENTOR
    const { reply, selectedAgent, relevantMemories, relevantKnowledge } = await processChatMessageCore({
      message: transcription,
      userId,
      agentId,
      history,
    });

    // 3. SALVAR A TRANSCRIÇÃO E A RESPOSTA NO BANCO DE DADOS
    const isAgentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAgent?.id || '');
    const safeAgentId = isAgentUuid ? selectedAgent.id : null;

    const { error: msgErr } = await supabaseAdmin.from('izaque_messages').insert([
      {
        user_id: userId,
        agent_id: safeAgentId,
        role: 'user',
        content: transcription,
        is_audio: true,
        audio_duration_seconds: durationSeconds || null,
      },
      {
        user_id: userId,
        agent_id: safeAgentId,
        role: 'assistant',
        content: reply,
        is_audio: false,
      },
    ]);

    if (msgErr) {
      console.warn('⚠️ Aviso ao gravar transcrição em izaque_messages:', msgErr);
    } else {
      console.log(`💾 [Supabase] Transcrição e resposta salvas na tabela izaque_messages!`);
    }

    // 4. RETORNAR RESPOSTA E TRANSCRIÇÃO PARA O FRONTEND
    res.status(200).json({
      transcription,
      reply,
      agentUsed: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        slug: selectedAgent.slug,
        type: selectedAgent.type,
      },
      memoriesUsed: (relevantMemories || []).map(m => ({
        content: m.content,
        category: m.category,
        similarity: m.similarity,
      })),
      knowledgeUsed: (relevantKnowledge || []).map(k => ({
        content: k.content,
        similarity: k.similarity,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [Audio Chat Error]:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem de áudio.', details: error.message });
  }
}

/**
 * Retorna todo o histórico de conversas do usuário ordenado cronologicamente
 */
export async function getChatHistory(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      // Se não for UUID válido, retorna histórico vazio com total isolamento
      return res.status(200).json([]);
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_messages')
      .select(`
        id,
        user_id,
        agent_id,
        role,
        content,
        is_audio,
        audio_duration_seconds,
        created_at,
        izaque_agents (
          id,
          name,
          slug,
          type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    // Formata os dados para o frontend (WhatsApp style)
    const formatted = (data || []).map((msg) => ({
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

    res.status(200).json(formatted);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de mensagens:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de mensagens.', details: error.message });
  }
}

/**
 * Limpa o histórico de conversas do usuário caso deseje reiniciar a sessão
 */
export async function clearChatHistory(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const { error } = await supabaseAdmin
      .from('izaque_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'Histórico de conversas reiniciado com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    res.status(500).json({ error: 'Erro ao limpar histórico.', details: error.message });
  }
}
