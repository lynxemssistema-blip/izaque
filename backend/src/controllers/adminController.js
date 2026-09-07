import { supabaseAdmin } from '../config/supabase.js';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { sendSubscriptionApprovedNotification } from '../services/emailService.js';

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
    const { system_prompt, temperature, name, is_active, starter_questions } = req.body;

    const updatePayload = {
      system_prompt,
      temperature,
      name,
      is_active,
      updated_at: new Date().toISOString(),
    };

    if (starter_questions !== undefined) {
      updatePayload.starter_questions = starter_questions;
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .update(updatePayload)
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
    const { name, slug, type = 'mindset', system_prompt, temperature = 0.7, starter_questions = [] } = req.body;

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
        starter_questions,
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
      const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);
      let extractedSuccess = false;

      for (const modelCandidate of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelCandidate });
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
          if (finalContent) {
            extractedSuccess = true;
            break;
          }
        } catch (mErr) {
          if (mErr.message && (mErr.message.includes('404') || mErr.message.includes('not found'))) {
            console.warn(`⚠️ [Document Fallback] Modelo ${modelCandidate} não encontrado, tentando alternativa...`);
            continue;
          }
          throw mErr;
        }
      }
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

// ==========================================
// GESTÃO DE PLANOS, PREÇOS E DADOS PIX (SUPERADMIN)
// ==========================================

// 13. Listar todos os planos cadastrados para edição
export async function getAdminPlans(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar planos admin:', error);
    res.status(500).json({ error: 'Erro ao carregar planos para administração.' });
  }
}

// 14. Atualizar valores, chave PIX e dados de um plano específico
export async function updateAdminPlan(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      billing_cycle,
      description,
      features,
      pix_key,
      pix_key_type,
      pix_beneficiary,
      activation_notice,
      is_active,
    } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (price !== undefined) updates.price = Number(price);
    if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle;
    if (description !== undefined) updates.description = description;
    if (features !== undefined) updates.features = Array.isArray(features) ? features : [];
    if (pix_key !== undefined) updates.pix_key = pix_key.trim();
    if (pix_key_type !== undefined) updates.pix_key_type = pix_key_type.trim();
    if (pix_beneficiary !== undefined) updates.pix_beneficiary = pix_beneficiary.trim();
    if (activation_notice !== undefined) updates.activation_notice = activation_notice.trim();
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await supabaseAdmin
      .from('izaque_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Plan Updated] Plano ${id} atualizado pelo Superadmin. Preço: R$ ${data.price}, Chave PIX: ${data.pix_key}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Falha ao salvar alterações do plano.', details: error.message });
  }
}

// ==========================================
// GESTÃO DE ACESSO E PLANOS DE CLIENTES (SUPERADMIN)
// ==========================================

// 15. Ativar ou Bloquear/Desativar o acesso geral de um cliente
export async function updateUserStatus(req, res) {
  try {
    const { userId, isActive } = req.body;

    if (!userId || isActive === undefined) {
      return res.status(400).json({ error: 'ID de usuário e status isActive obrigatórios.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update({
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`👤 [User Access] Usuário ${userId} status de acesso alterado para: ${isActive ? 'ATIVO' : 'BLOQUEADO'}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao alterar status de acesso do usuário:', error);
    res.status(500).json({ error: 'Erro ao alterar status de acesso do usuário.' });
  }
}

// 16. Ativar ou alterar o plano de um usuário manualmente
export async function updateUserPlan(req, res) {
  try {
    const { userId, planId, planStatus, planExpiresAt } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'ID do usuário e plano são obrigatórios.' });
    }

    const updates = {
      plan_id: planId,
      plan_status: planStatus || 'active',
      updated_at: new Date().toISOString(),
    };

    if (planId !== 'free') {
      updates.plan_activated_at = new Date().toISOString();
      if (planExpiresAt) {
        updates.plan_expires_at = planExpiresAt;
      }
    } else {
      updates.plan_expires_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`💎 [User Plan Updated] Usuário ${userId} teve o plano alterado para: ${planId}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar plano do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano do usuário.' });
  }
}

// 17. Listar todos os pedidos e assinaturas PIX
export async function getAdminSubscriptions(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_subscriptions')
      .select(`
        *,
        plan:izaque_plans(name, billing_cycle)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar assinaturas admin:', error);
    res.status(500).json({ error: 'Erro ao carregar pedidos de assinatura.' });
  }
}

// 18. Aprovar pedido PIX e ativar plano do cliente imediatamente
export async function approveSubscription(req, res) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    // Busca a assinatura
    const { data: sub, error: subErr } = await supabaseAdmin
      .from('izaque_subscriptions')
      .select('*, plan:izaque_plans(name, billing_cycle)')
      .eq('id', id)
      .single();

    if (subErr || !sub) {
      return res.status(404).json({ error: 'Pedido de assinatura não encontrado.' });
    }

    // Calcula validade (30 dias para mensal, 365 dias para anual)
    const now = new Date();
    const expiresAt = new Date(now);
    if (sub.plan?.billing_cycle === 'annual') {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // 1. Atualiza a assinatura para 'active'
    await supabaseAdmin
      .from('izaque_subscriptions')
      .update({
        status: 'active',
        approved_at: now.toISOString(),
        approved_by: adminId || null,
      })
      .eq('id', id);

    // 2. Atualiza o perfil do usuário
    const { data: updatedProfile, error: profErr } = await supabaseAdmin
      .from('izaque_profiles')
      .update({
        plan_id: sub.plan_id,
        plan_status: 'active',
        plan_activated_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
        is_active: true, // Garante que o acesso está ativo
        updated_at: now.toISOString(),
      })
      .eq('id', sub.user_id)
      .select()
      .single();

    if (profErr) throw profErr;

    // 3. Envia e-mail de parabéns e ativação para o cliente
    sendSubscriptionApprovedNotification({
      toEmail: sub.user_email,
      userName: sub.user_name,
      planName: sub.plan?.name || sub.plan_id,
    }).catch((e) => console.warn('Aviso ao enviar e-mail de aprovação:', e));

    console.log(`🎉 [Subscription Approved] Assinatura ${id} aprovada para ${sub.user_email}!`);
    res.status(200).json({
      success: true,
      message: `Plano ${sub.plan?.name || sub.plan_id} ativado com sucesso para ${sub.user_email}!`,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('❌ Erro ao aprovar assinatura:', error);
    res.status(500).json({ error: 'Falha ao aprovar assinatura.', details: error.message });
  }
}

// 19. Listar feedbacks, sugestões e reclamações recebidas de clientes
export async function getAdminFeedbacks(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar feedbacks:', error);
    res.status(500).json({ error: 'Erro ao carregar mensagens de suporte.' });
  }
}

// 20. Obter perfil do Idealizador do IZAQUE
export async function getAdminCreator(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_creator')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.status(200).json(data || {});
  } catch (error) {
    console.error('❌ Erro ao buscar dados do idealizador:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do idealizador.' });
  }
}

// 21. Atualizar perfil do Idealizador pelo Super Admin
export async function updateAdminCreator(req, res) {
  try {
    const {
      name,
      title,
      bio,
      story,
      quote,
      image_url,
      social_instagram,
      social_linkedin,
      social_whatsapp,
      is_visible,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('izaque_creator')
      .upsert({
        id: 'main',
        name: name || 'Edson Manoel',
        title: title || 'Idealizador & Criador do IZAQUE',
        bio: bio || '',
        story: story || '',
        quote: quote || '',
        image_url: image_url || '',
        social_instagram: social_instagram || null,
        social_linkedin: social_linkedin || null,
        social_whatsapp: social_whatsapp || null,
        is_visible: is_visible !== undefined ? is_visible : true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({
      success: true,
      message: 'Perfil do Idealizador atualizado com sucesso!',
      creator: data,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil do idealizador:', error);
    res.status(500).json({ error: 'Falha ao salvar dados do idealizador.', details: error.message });
  }
}


