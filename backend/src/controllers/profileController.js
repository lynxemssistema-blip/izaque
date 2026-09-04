import { supabaseAdmin } from '../config/supabase.js';

/**
 * Controller de Perfil do Usuário
 * Permite que o usuário visualize e edite seus dados:
 * - Nome de exibição (full_name)
 * - Foto de perfil / Avatar (avatar_url)
 * - Telefone / WhatsApp (phone)
 */

export async function getProfile(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Perfil não encontrado.' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao buscar perfil.', details: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const { full_name, phone, avatar_url } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updatePayload.full_name = full_name.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url.trim();

    // 1. Atualiza na tabela public.izaque_profiles
    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // 2. Sincroniza também no auth.users metadata para manter compatibilidade
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: updatePayload.full_name,
          phone: updatePayload.phone,
          avatar_url: updatePayload.avatar_url,
        },
      });
    } catch (metaErr) {
      console.warn('⚠️ Aviso ao sincronizar metadata em auth.users:', metaErr.message);
    }

    console.log(`👤 [Profile Updated] Perfil do usuário [${userId}] atualizado com sucesso:`, {
      name: updatePayload.full_name,
      phone: updatePayload.phone,
      hasAvatar: Boolean(updatePayload.avatar_url),
    });

    res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      profile: data,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar dados do perfil.', details: error.message });
  }
}
