import { supabaseAdmin } from '../config/supabase.js';
import { genAI, CHAT_MODEL } from '../config/gemini.js';

/**
 * Controller Administrativo (Exclusivo para Super Admin / Master)
 */

// 1. Obter métricas gerais do sistema
export async function getAdminMetrics(req, res) {
  try {
    const [usersRes, memoriesRes, agentsRes] = await Promise.all([
      supabaseAdmin.from('izaque_profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('izaque_user_memories').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('izaque_agents').select('id', { count: 'exact', head: true }),
    ]);

    // Contagem de memórias por categoria
    const { data: categoryStats } = await supabaseAdmin
      .from('izaque_user_memories')
      .select('category');

    const categoriesCount = (categoryStats || []).reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      totalUsers: usersRes.count || 0,
      totalMemories: memoriesRes.count || 0,
      totalAgents: agentsRes.count || 0,
      categoriesCount,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar métricas admin:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas.' });
  }
}

// 2. Listar todos os usuários com perfis
export async function getAdminUsers(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

// 3. Atualizar role de usuário (ex: promover a admin/master)
export async function updateUserRole(req, res) {
  try {
    const { userId, role } = req.body;
    if (!userId || !['master', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Dados inválidos para atualização de role.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao alterar role:', error);
    res.status(500).json({ error: 'Erro ao alterar role do usuário.' });
  }
}

// 4. Listar memórias de longo prazo (RAG) com informações de usuário
export async function getAdminMemories(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_user_memories')
      .select(`
        id,
        user_id,
        content,
        category,
        importance_score,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao listar memórias:', error);
    res.status(500).json({ error: 'Erro ao listar memórias.' });
  }
}

// 5. Listar e gerenciar Agentes/Mentores
export async function getAdminAgents(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao listar agentes:', error);
    res.status(500).json({ error: 'Erro ao listar agentes.' });
  }
}

// 6. Atualizar System Prompt ou Temperatura do Agente
export async function updateAdminAgent(req, res) {
  try {
    const { id } = req.params;
    const { system_prompt, temperature, name, is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .update({
        system_prompt,
        temperature,
        name,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar agente:', error);
    res.status(500).json({ error: 'Erro ao atualizar agente.' });
  }
}

// 7. Criar novo Agente Especialista
export async function createAdminAgent(req, res) {
  try {
    const { name, slug, type = 'mindset', system_prompt, temperature = 0.7 } = req.body;

    if (!name || !system_prompt) {
      return res.status(400).json({ error: 'Nome e System Prompt são obrigatórios.' });
    }

    // Gerar slug caso não informado
    const finalSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4));

    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .insert({
        name: name.trim(),
        slug: finalSlug,
        type: type.toLowerCase(),
        system_prompt: system_prompt.trim(),
        temperature: Number(temperature) || 0.7,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    console.log(`🤖 [IZAQUE Multi-Agent] Novo especialista criado: "${data.name}" (${data.slug})`);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao criar agente:', error);
    res.status(500).json({ error: 'Erro ao cadastrar agente.', details: error.message });
  }
}

// 8. Excluir Agente Especialista (exceto izaque-master)
export async function deleteAdminAgent(req, res) {
  try {
    const { id } = req.params;

    // Proteção para não excluir o mestre
    const { data: agent } = await supabaseAdmin
      .from('izaque_agents')
      .select('slug')
      .eq('id', id)
      .single();

    if (agent?.slug === 'izaque-master') {
      return res.status(400).json({ error: 'O Agente Mestre IZAQUE não pode ser excluído.' });
    }

    const { error } = await supabaseAdmin
      .from('izaque_agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Agente removido com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir agente:', error);
    res.status(500).json({ error: 'Erro ao excluir agente.' });
  }
}

// 9. Inserir arquivo/texto de estudo na base de conhecimento do agente
export async function uploadAgentDocument(req, res) {
  try {
    const { id } = req.params; // agentId
    const { title, content, fileBase64, mimeType, fileType = 'text' } = req.body;

    if (!title || (!content && !fileBase64)) {
      return res.status(400).json({ error: 'Título e conteúdo ou arquivo de estudo são obrigatórios.' });
    }

    let finalContent = content || '';

    // Se o arquivo for binário (ex: PDF ou documento), extrai texto integralmente via Gemini Multimodal
    if (fileBase64 && (!finalContent || finalContent.trim().length === 0)) {
      console.log(`📑 [Agent Grounding] Extraindo texto de documento binário via Gemini (${mimeType || 'application/pdf'})...`);
      const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
      const extractRes = await model.generateContent([
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType || 'application/pdf',
          },
        },
        'Você é um extrator de literatura técnica, livros e manuais para especialização de IA. Extraia e transcreva integralmente todo o conteúdo textual, tópicos, definições, frameworks e metodologias deste arquivo em português claro. Não faça resumos, preserve o texto completo.',
      ]);
      finalContent = extractRes.response.text();
    }

    if (!finalContent || finalContent.trim().length === 0) {
      return res.status(400).json({ error: 'Não foi possível extrair texto do documento para estudo.' });
    }

    const { ingestAgentDocument } = await import('../services/agentKnowledgeService.js');
    const document = await ingestAgentDocument({
      agentId: id,
      title,
      content: finalContent,
      fileType,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('❌ Erro ao processar documento do agente:', error);
    res.status(500).json({ error: 'Erro ao ingerir documento de estudo.', details: error.message });
  }
}

// 10. Listar documentos de estudo de um agente
export async function getAgentDocuments(req, res) {
  try {
    const { id } = req.params; // agentId
    const { data, error } = await supabaseAdmin
      .from('izaque_agent_documents')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar documentos do agente:', error);
    res.status(500).json({ error: 'Erro ao listar documentos de estudo.' });
  }
}

// 11. Excluir documento de estudo e seus vetores no pgvector
export async function deleteAgentDocument(req, res) {
  try {
    const { docId } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_agent_documents')
      .delete()
      .eq('id', docId);

    if (error) throw error;
    res.status(200).json({ message: 'Documento e vetores de estudo removidos.' });
  } catch (error) {
    console.error('❌ Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento.' });
  }
}

// 12. Obter trechos (chunks) vetorizados de um documento para inspeção
export async function getAgentDocumentChunks(req, res) {
  try {
    const { docId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_agent_knowledge')
      .select('id, content, created_at')
      .eq('document_id', docId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar trechos do documento:', error);
    res.status(500).json({ error: 'Erro ao carregar trechos do documento.' });
  }
}
