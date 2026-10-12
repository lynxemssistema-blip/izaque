import { supabaseAdmin } from '../config/supabase.js';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import {
  sendSubscriptionApprovedNotification,
  generateBroadcastEmailDraft,
  sendBroadcastEmail,
  renderBroadcastEmailHtml,
} from '../services/emailService.js';

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

/**
 * 23. Solicita ao Gemini para redigir o e-mail de novidades detalhista e humanizado
 * POST /api/admin/broadcast/draft
 */
export async function generateBroadcastDraftController(req, res) {
  try {
    const { topic, targetAudience = 'all', extraPrompt = '' } = req.body;
    console.log('✍️ [Admin Broadcast] Solicitando ao Gemini redação do e-mail de novidades...');

    const draft = await generateBroadcastEmailDraft({
      topic,
      targetAudience,
      extraPrompt,
    });

    const appUrl = (process.env.APP_URL || 'https://izaque.lynxems.com.br').replace(/\/$/, '');
    const previewHtml = renderBroadcastEmailHtml({
      contentHtml: draft.bodyHtml,
      userName: 'Viajante',
      appUrl,
      callToActionText: draft.callToActionText || 'Visitar Meu Refúgio Agora',
    });

    res.status(200).json({
      success: true,
      draft,
      previewHtml,
    });
  } catch (error) {
    console.error('❌ Erro ao gerar rascunho de e-mail com IA:', error);
    res.status(500).json({
      error: 'Erro ao redigir e-mail com IA.',
      details: error.message,
    });
  }
}

/**
 * 24. Estatísticas de público para envio em massa
 * GET /api/admin/broadcast/stats
 */
export async function getBroadcastStatsController(req, res) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, email, plan_id, is_active')
      .not('email', 'is', null)
      .neq('is_active', false);

    if (error) throw error;

    const validUsers = (users || []).filter(u => u.email && u.email.includes('@'));
    const totalUsers = validUsers.length;
    const subscribers = validUsers.filter(u => u.plan_id && u.plan_id !== 'free').length;
    const freeUsers = validUsers.filter(u => !u.plan_id || u.plan_id === 'free').length;

    res.status(200).json({
      totalUsers,
      subscribers,
      freeUsers,
      smtpUser: process.env.SMTP_USER || 'suporte@lynxems.com.br',
      smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de público para e-mail:', error);
    res.status(500).json({ error: 'Falha ao buscar estatísticas de e-mail.', details: error.message });
  }
}

/**
 * 25. Disparo oficial do e-mail em massa para os usuários
 * POST /api/admin/broadcast/send
 */
export async function sendBroadcastMessageController(req, res) {
  try {
    const {
      subject,
      htmlContent,
      callToActionText = 'Visitar Meu Refúgio Agora',
      targetAudience = 'all',
      testEmail = null,
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'O assunto do e-mail é obrigatório.' });
    }

    if (!htmlContent || !htmlContent.trim()) {
      return res.status(400).json({ error: 'O conteúdo da mensagem é obrigatório.' });
    }

    console.log(`🚀 [Admin Broadcast] Iniciando disparo de e-mail (Público: ${targetAudience})...`);

    const result = await sendBroadcastEmail({
      subject: subject.trim(),
      htmlContent: htmlContent.trim(),
      callToActionText: callToActionText?.trim() || 'Visitar Meu Refúgio Agora',
      targetAudience,
      testEmail,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erro no disparo de broadcast de e-mail:', error);
    res.status(500).json({
      error: 'Falha ao disparar e-mails para os usuários.',
      details: error.message,
    });
  }
}

/**
 * 26. Listar conversas direcionadas ativas para os usuários
 * GET /api/guided-conversations
 */
export async function getPublicGuidedConversations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar conversas direcionadas públicas:', error);
    res.status(500).json({ error: 'Erro ao carregar conversas direcionadas.' });
  }
}

/**
 * 27. Listar todas as conversas direcionadas para administração (Superadmin)
 * GET /api/admin/guided-conversations
 */
export async function getAdminGuidedConversations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar conversas direcionadas admin:', error);
    res.status(500).json({ error: 'Erro ao carregar conversas direcionadas para administração.' });
  }
}

/**
 * 28. Criar nova conversa direcionada com perguntas (Superadmin)
 * POST /api/admin/guided-conversations
 */
export async function createAdminGuidedConversation(req, res) {
  try {
    const {
      title,
      description,
      category = 'Geral',
      icon = 'Compass',
      agent_slug = 'izaque-master',
      questions = [],
      is_active = true,
      order_index = 0,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título da conversa direcionada é obrigatório.' });
    }

    const payload = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'Geral',
      icon: icon ? icon.trim() : 'Compass',
      agent_slug: agent_slug ? agent_slug.trim() : 'izaque-master',
      questions: Array.isArray(questions) ? questions : [],
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      order_index: Number(order_index) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao criar conversa direcionada:', error);
    res.status(500).json({ error: 'Erro ao criar conversa direcionada: ' + error.message });
  }
}

/**
 * 29. Atualizar conversa direcionada e perguntas (Superadmin)
 * PUT /api/admin/guided-conversations/:id
 */
export async function updateAdminGuidedConversation(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      icon,
      agent_slug,
      questions,
      is_active,
      order_index,
    } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (icon !== undefined) updates.icon = icon.trim();
    if (agent_slug !== undefined) updates.agent_slug = agent_slug.trim();
    if (questions !== undefined) updates.questions = Array.isArray(questions) ? questions : [];
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (order_index !== undefined) updates.order_index = Number(order_index) || 0;

    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar conversa direcionada:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa direcionada: ' + error.message });
  }
}

/**
 * 30. Excluir conversa direcionada (Superadmin)
 * DELETE /api/admin/guided-conversations/:id
 */
export async function deleteAdminGuidedConversation(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Conversa direcionada removida com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir conversa direcionada:', error);
    res.status(500).json({ error: 'Erro ao excluir conversa direcionada: ' + error.message });
  }
}

/**
 * 31. Listar Grupos de Usuários com contagem de membros (Superadmin)
 * GET /api/admin/user-groups
 */
export async function getAdminUserGroups(req, res) {
  try {
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('izaque_user_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupsError) throw groupsError;

    // Buscar membros para calcular contagem por grupo
    const { data: members, error: membersError } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('group_id, user_id');

    if (membersError) throw membersError;

    const countMap = {};
    (members || []).forEach((m) => {
      countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
    });

    const enriched = (groups || []).map((g) => ({
      ...g,
      member_count: countMap[g.id] || 0,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Erro ao listar grupos de usuários:', error);
    res.status(500).json({ error: 'Erro ao carregar grupos de usuários.' });
  }
}

/**
 * 32. Criar novo Grupo de Usuários (Superadmin)
 * POST /api/admin/user-groups
 */
export async function createAdminUserGroup(req, res) {
  try {
    const { name, description = '', color = '#0f766e' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome do grupo é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_user_groups')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : '',
        color: color ? color.trim() : '#0f766e',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, member_count: 0 });
  } catch (error) {
    console.error('❌ Erro ao criar grupo de usuários:', error);
    res.status(500).json({ error: 'Erro ao criar grupo: ' + error.message });
  }
}

/**
 * 33. Atualizar Grupo de Usuários (Superadmin)
 * PUT /api/admin/user-groups/:id
 */
export async function updateAdminUserGroup(req, res) {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (color !== undefined) updates.color = color.trim();

    const { data, error } = await supabaseAdmin
      .from('izaque_user_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar grupo de usuários:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo: ' + error.message });
  }
}

/**
 * 34. Excluir Grupo de Usuários (Superadmin)
 * DELETE /api/admin/user-groups/:id
 */
export async function deleteAdminUserGroup(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_user_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Grupo excluído com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir grupo:', error);
    res.status(500).json({ error: 'Erro ao excluir grupo: ' + error.message });
  }
}

/**
 * 35. Listar Membros de um Grupo (Superadmin)
 * GET /api/admin/user-groups/:id/members
 */
export async function getAdminGroupMembers(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('user_id, created_at')
      .eq('group_id', id);

    if (error) throw error;

    const userIds = (data || []).map((m) => m.user_id);
    if (userIds.length === 0) return res.status(200).json([]);

    const { data: profiles, error: profError } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, avatar_url, role, plan_status')
      .in('id', userIds);

    if (profError) throw profError;
    res.status(200).json(profiles || []);
  } catch (error) {
    console.error('❌ Erro ao listar membros do grupo:', error);
    res.status(500).json({ error: 'Erro ao carregar membros do grupo.' });
  }
}

/**
 * 36. Consultar grupos de um usuário específico (Superadmin)
 * GET /api/admin/users/:userId/groups
 */
export async function getUserAssignedGroups(req, res) {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (error) throw error;
    const groupIds = (data || []).map((row) => row.group_id);
    res.status(200).json(groupIds);
  } catch (error) {
    console.error('❌ Erro ao buscar grupos do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos do usuário.' });
  }
}

/**
 * 37. Atualizar grupos atribuídos a um usuário (Classificação de Usuário em múltiplos grupos)
 * POST /api/admin/users/:userId/groups
 */
export async function setUserAssignedGroups(req, res) {
  try {
    const { userId } = req.params;
    const { groupIds = [] } = req.body;

    // 1. Remove memberships anteriores
    await supabaseAdmin
      .from('izaque_user_group_members')
      .delete()
      .eq('user_id', userId);

    // 2. Insere as novas memberships se houver
    if (Array.isArray(groupIds) && groupIds.length > 0) {
      const inserts = groupIds.map((gId) => ({
        group_id: gId,
        user_id: userId,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('izaque_user_group_members')
        .insert(inserts);

      if (insertError) throw insertError;
    }

    res.status(200).json({ success: true, groupIds });
  } catch (error) {
    console.error('❌ Erro ao atualizar grupos do usuário:', error);
    res.status(500).json({ error: 'Erro ao salvar grupos do usuário: ' + error.message });
  }
}

/**
 * 38. Disparar Mensagem ou Áudio para um ou mais Grupos com deduplicação
 * POST /api/admin/group-broadcasts
 */
export async function sendGroupBroadcast(req, res) {
  try {
    const {
      title,
      content = '',
      audio_url = null,
      target_group_ids = [],
      sender_id = null,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título do comunicado é obrigatório.' });
    }

    if (!Array.isArray(target_group_ids) || target_group_ids.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um grupo de destino.' });
    }

    if (!content?.trim() && !audio_url) {
      return res.status(400).json({ error: 'Informe uma mensagem em texto ou anexe um áudio para disparo.' });
    }

    // 1. Obter lista de usuários dos grupos selecionados com deduplicação (DISTINCT)
    const { data: memberRows, error: membersError } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('user_id')
      .in('group_id', target_group_ids);

    if (membersError) throw membersError;

    // Deduplicação: cria conjunto de IDs únicos
    const uniqueUserIds = Array.from(new Set((memberRows || []).map((m) => m.user_id)));

    if (uniqueUserIds.length === 0) {
      return res.status(400).json({
        error: 'Nenhum usuário foi encontrado nos grupos selecionados para receber o comunicado.',
      });
    }

    // 2. Registrar o broadcast na tabela izaque_group_broadcasts
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from('izaque_group_broadcasts')
      .insert({
        title: title.trim(),
        content: content ? content.trim() : '',
        audio_url: audio_url || null,
        target_group_ids,
        sender_id: sender_id || null,
      })
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    // 3. Criar notificações individuais para cada usuário único
    const notificationsToInsert = uniqueUserIds.map((uId) => ({
      user_id: uId,
      broadcast_id: broadcast.id,
      title: title.trim(),
      content: content ? content.trim() : '',
      audio_url: audio_url || null,
      is_read: false,
    }));

    const { error: notifError } = await supabaseAdmin
      .from('izaque_user_notifications')
      .insert(notificationsToInsert);

    if (notifError) throw notifError;

    res.status(201).json({
      success: true,
      broadcastId: broadcast.id,
      deliveredUsersCount: uniqueUserIds.length,
      message: `Comunicado enviado com sucesso para ${uniqueUserIds.length} usuário(s)!`,
    });
  } catch (error) {
    console.error('❌ Erro no envio de comunicado para grupos:', error);
    res.status(500).json({ error: 'Erro ao enviar comunicado para grupos: ' + error.message });
  }
}

/**
 * 39. Listar histórico de disparos por grupo (Superadmin)
 * GET /api/admin/group-broadcasts
 */
export async function getAdminGroupBroadcasts(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_group_broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar comunicados:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de comunicados.' });
  }
}

/**
 * 40. Obter notificações e comunicados do usuário logado (In-App)
 * GET /api/user/notifications/:userId
 */
export async function getUserNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar notificações do usuário:', error);
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
}

/**
 * 41. Marcar notificação como lida
 * PATCH /api/user/notifications/:id/read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
}

/**
 * 42. Marcar todas as notificações do usuário como lidas
 * PATCH /api/user/notifications/read-all/:userId
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    const { userId } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao marcar todas notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificações.' });
  }
}





