import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

/**
 * Cria o transportador SMTP oficial usando o servidor Hostinger
 */
export function getEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = (process.env.SMTP_USER || 'suporte@lynxems.com.br').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (!pass) {
    throw new Error('SMTP_PASS não configurada nas variáveis de ambiente.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Envia um e-mail de teste para verificar a conectividade com o servidor SMTP da Hostinger
 */
export async function sendTestEmail(toEmail) {
  const transporter = getEmailTransporter();
  const fromAddress = `"IZAQUE - Suporte & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: '🌿 Teste de Conexão - Suporte IZAQUE',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Santuário & Mentoria de Vida</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; color: #1c1917; margin-top: 0;">✅ Teste de E-mail de Suporte Concluído</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            Olá! Este é um e-mail de teste para validar o canal de suporte oficial do <strong>IZAQUE</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            O servidor SMTP da Hostinger (<code>smtp.hostinger.com:465</code>) está conectado com sucesso e pronto para envio das recuperações de senha e suporte dos usuários.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #115e59;">
              <strong>Canal Oficial:</strong> suporte@lynxems.com.br<br>
              <strong>Data/Hora do Teste:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #a8a29e;">
          © ${new Date().getFullYear()} IZAQUE Mentoria. Todos os direitos reservados.
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✉️ [SMTP Success] E-mail de teste enviado para ${toEmail}. Message ID: ${info.messageId}`);
  return info;
}

/**
 * Envia o e-mail de recuperação de senha com link seguro
 */
export async function sendPasswordResetEmail({ toEmail, name, resetLink }) {
  const transporter = getEmailTransporter();
  const fromAddress = `"IZAQUE - Suporte & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const displayName = name ? name.split(' ')[0] : 'Viajante';

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: '🔑 Recuperação de Acesso ao seu Refúgio - IZAQUE',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Santuário & Mentoria de Vida</p>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; color: #1c1917; margin-top: 0;">Olá, ${displayName}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            Recebemos uma solicitação para redefinir a sua senha de acesso ao seu refúgio pessoal no <strong>IZAQUE</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            Para criar sua nova senha com segurança, clique no botão abaixo:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.25);">
              Redefinir Minha Senha
            </a>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #78716c; margin-top: 24px; border-top: 1px solid #f5f5f4; padding-top: 16px;">
            Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <a href="${resetLink}" style="color: #0f766e; word-break: break-all; font-size: 11px;">${resetLink}</a>
          </p>

          <p style="font-size: 12px; color: #a8a29e; margin-top: 16px;">
            ⚠️ Se você não solicitou a redefinição de senha, apenas ignore este e-mail. Seu acesso continua protegido.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #78716c;">
          Dúvidas ou suporte? Responda diretamente para <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e; font-weight: 500;">suporte@lynxems.com.br</a>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✉️ [Password Reset Sent] E-mail enviado com sucesso para ${toEmail}. Message ID: ${info.messageId}`);
  return info;
}

/**
 * Envia notificação de pedido de assinatura PIX recebido
 */
export async function sendSubscriptionOrderNotification({ toEmail, userName, planName, price, pixKey }) {
  try {
    const transporter = getEmailTransporter();
    const fromAddress = `"IZAQUE - Suporte & Assinaturas" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;
    const formattedPrice = Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 1. E-mail de confirmação para o Usuário
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: '🌿 Recebemos sua solicitação de assinatura - IZAQUE',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
            <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Santuário & Mentoria de Vida</p>
          </div>

          <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <h2 style="font-size: 18px; color: #1c1917; margin-top: 0;">Olá, ${userName || 'Viajante'}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Recebemos seu pedido de ativação do plano <strong>${planName}</strong> no valor de <strong>${formattedPrice}</strong>.
            </p>
            
            <div style="margin: 24px 0; padding: 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f766e;">⏳ Informação Importante sobre a Ativação</h3>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #115e59;">
                O pagamento é realizado exclusivamente via <strong>PIX</strong>. A ativação do plano pode demorar <strong>até 10 minutos</strong> após o pagamento para confirmação e liberação pelo sistema.
              </p>
            </div>

            <p style="font-size: 13px; color: #78716c;">
              Chave PIX utilizada: <code>${pixKey}</code>
            </p>
            <p style="font-size: 13px; color: #78716c;">
              Assim que o valor for identificado, seu acesso ilimitado com voz neural será liberado imediatamente!
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #78716c;">
            Qualquer dúvida, responda para <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e; font-weight: 500;">suporte@lynxems.com.br</a>
          </div>
        </div>
      `,
    });

    // 2. Alerta para a equipe Lynx
    await transporter.sendMail({
      from: fromAddress,
      to: process.env.SMTP_USER || 'suporte@lynxems.com.br',
      subject: `🔔 [Novo Pedido PIX] ${userName || toEmail} escolheu ${planName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3>Novo pedido de assinatura registrado:</h3>
          <ul>
            <li><strong>Cliente:</strong> ${userName || 'Sem nome'} (${toEmail})</li>
            <li><strong>Plano:</strong> ${planName}</li>
            <li><strong>Valor:</strong> ${formattedPrice}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</li>
          </ul>
          <p>Acesse o <a href="https://izaque.lynxems.com.br">Painel de Gestão IZAQUE</a> para conferir e aprovar.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn('⚠️ [Subscription Email] Aviso ao enviar notificação de pedido:', err.message);
  }
}

/**
 * Envia notificação de aprovação e ativação de plano
 */
export async function sendSubscriptionApprovedNotification({ toEmail, userName, planName }) {
  try {
    const transporter = getEmailTransporter();
    const fromAddress = `"IZAQUE - Suporte & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: '✨ Seu refúgio ilimitado foi ativado! - IZAQUE',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
            <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Santuário & Mentoria de Vida</p>
          </div>

          <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03); text-align: center;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background-color: #0f766e; color: #ffffff; font-size: 28px; line-height: 54px; margin: 0 auto 16px auto;">
              ✓
            </div>
            <h2 style="font-size: 20px; color: #1c1917; margin-top: 0;">Plano Ativado com Sucesso!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Olá, <strong>${userName || 'Viajante'}</strong>! Seu plano <strong>${planName}</strong> foi aprovado e já está ativo no seu refúgio.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Agora você tem acesso ilimitado à voz neural de estúdio do Gemini, memória profunda contínua e suporte prioritário.
            </p>

            <div style="margin: 32px 0;">
              <a href="https://izaque.lynxems.com.br" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600; font-size: 14px; display: inline-block;">
                Entrar no Santuário IZAQUE
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #78716c;">
            Equipe Lynx EMS • <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e;">suporte@lynxems.com.br</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn('⚠️ [Approved Email] Aviso ao enviar e-mail de aprovação:', err.message);
  }
}

/**
 * Envia mensagem/reclamação/sugestão do assinante para o suporte oficial Lynx
 */
export async function sendFeedbackToSupport({ fromEmail, userName, userPlan, type, subject, message }) {
  const transporter = getEmailTransporter();
  const supportEmail = process.env.SMTP_USER || 'suporte@lynxems.com.br';
  const typeLabelMap = {
    suggestion: '💡 Sugestão de Melhoria',
    complaint: '⚠️ Reclamação de Assinante',
    support: '🛠️ Pedido de Suporte Técnico',
    praise: '🌟 Elogio / Depoimento',
  };
  const typeLabel = typeLabelMap[type] || '📩 Mensagem de Usuário';

  // 1. Envia para a equipe de suporte
  const info = await transporter.sendMail({
    from: `"IZAQUE Assinantes" <${supportEmail}>`,
    replyTo: fromEmail,
    to: supportEmail,
    subject: `[${typeLabel}] ${subject || 'Sem Assunto'} - ${userName} (${fromEmail})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #0f766e; margin-top: 0;">Nova mensagem de cliente do IZAQUE</h2>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Tipo:</strong></td><td style="color: #0f172a;">${typeLabel}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Nome:</strong></td><td style="color: #0f172a;">${userName || 'Não informado'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>E-mail:</strong></td><td style="color: #0f172a;">${fromEmail}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Plano:</strong></td><td style="color: #0f172a;">${userPlan || 'free'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Assunto:</strong></td><td style="color: #0f172a;">${subject}</td></tr>
          </table>

          <div style="padding: 16px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
${message}
          </div>
        </div>
      </div>
    `,
  });

  // 2. Confirmação automática para o usuário
  try {
    await transporter.sendMail({
      from: `"Suporte Lynx EMS" <${supportEmail}>`,
      to: fromEmail,
      subject: `🌿 Recebemos sua mensagem: "${subject}" - Suporte IZAQUE`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 24px; border-radius: 16px; border: 1px solid #e7e5e4;">
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px;">
            <h3 style="color: #0f766e; margin-top: 0;">Olá, ${userName || 'Viajante'}!</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Confirmamos o recebimento da sua mensagem sobre <strong>"${subject}"</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Nossa equipe de suporte técnico e desenvolvimento da Lynx já está analisando o seu contato e responderá diretamente a este e-mail o mais breve possível.
            </p>
            <p style="font-size: 12px; color: #78716c; margin-top: 20px; border-top: 1px solid #f5f5f4; padding-top: 12px;">
              Canal oficial de atendimento: suporte@lynxems.com.br
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn('⚠️ [Feedback Confirmation] Erro ao enviar cópia ao cliente:', err.message);
  }

  return info;
}

