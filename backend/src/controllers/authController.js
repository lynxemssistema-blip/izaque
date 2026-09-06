import { supabaseAdmin } from '../config/supabase.js';
import { sendPasswordResetEmail, sendTestEmail } from '../services/emailService.js';

/**
 * Controller de Recuperação de Senha Oficial
 * Rota: POST /api/auth/forgot-password
 */
export async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const appUrl = (process.env.APP_URL || 'https://izaque.lynxems.com.br').replace(/\/$/, '');

    // 1. Busca os dados do perfil do usuário para capturar o nome
    const { data: profile } = await supabaseAdmin
      .from('izaque_profiles')
      .select('full_name')
      .eq('email', cleanEmail)
      .maybeSingle();

    // 2. Gera o link criptografado de recuperação via Supabase Admin (sem disparar e-mail do Supabase)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl}/?mode=reset-password`,
      },
    });

    if (linkError) {
      console.warn(`⚠️ [Forgot Password] Aviso ao gerar link para ${cleanEmail}:`, linkError.message);
      // Para segurança (prevenção de enumeração de e-mails), respondemos com sucesso mesmo se não existir
      return res.status(200).json({
        message: 'Se este e-mail estiver cadastrado, você receberá o link de recuperação em instantes.',
      });
    }

    const resetLink = linkData?.properties?.action_link;
    if (!resetLink) {
      throw new Error('Não foi possível gerar o link de recuperação.');
    }

    // 3. Dispara o e-mail oficial através do SMTP Hostinger (suporte@lynxems.com.br)
    await sendPasswordResetEmail({
      toEmail: cleanEmail,
      name: profile?.full_name || '',
      resetLink,
    });

    console.log(`🔑 [Forgot Password] Link de recuperação enviado para ${cleanEmail} via suporte@lynxems.com.br`);

    res.status(200).json({
      message: 'Link de recuperação enviado com sucesso para o seu e-mail!',
      sentTo: cleanEmail,
    });
  } catch (error) {
    console.error('❌ Erro no fluxo de forgot-password:', error);
    res.status(500).json({
      error: 'Erro ao processar a recuperação de senha. Tente novamente em instantes.',
      details: error.message,
    });
  }
}

/**
 * Rota de Teste do Envio de E-mail
 * Rota: POST /api/auth/test-email
 */
export async function handleTestEmail(req, res) {
  try {
    const { email } = req.body;
    const targetEmail = email || 'edsonmanoel2012@gmail.com';

    const info = await sendTestEmail(targetEmail);
    res.status(200).json({
      message: `E-mail de teste enviado com sucesso para ${targetEmail}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de teste:', error);
    res.status(500).json({
      error: 'Falha ao enviar e-mail de teste.',
      details: error.message,
    });
  }
}
