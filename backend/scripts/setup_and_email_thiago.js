import pg from 'pg';
import { getEmailTransporter } from '../src/services/emailService.js';

const password = '10207597Rdv*';
const projectRef = 'ohjuqcrpakswvnoqobiq';

const thiagoEmail = 'thiagopratas@gmail.com';
const newPassword = 'Thiago@Izaque2026';

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: password,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('🔄 Conectando ao banco de dados...');
  await client.connect();

  try {
    await client.query('create extension if not exists pgcrypto;');

    // 1. Atualiza a senha e confirma e-mail em auth.users
    console.log(`🔐 Atualizando senha de ${thiagoEmail} em auth.users...`);
    const updateRes = await client.query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE email = $2
      RETURNING id, email;
    `, [newPassword, thiagoEmail]);

    let userId;
    if (updateRes.rows.length === 0) {
      console.log('Criando usuário...');
      const insertUser = await client.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt($2, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}',
          '{"full_name":"Thiago Prata"}', now(), now()
        ) RETURNING id;
      `, [thiagoEmail, newPassword]);
      userId = insertUser.rows[0].id;
    } else {
      userId = updateRes.rows[0].id;
      console.log(`✅ Senha atualizada com sucesso para ${thiagoEmail} (ID: ${userId})`);
    }

    // 2. Garantir perfil em public.izaque_profiles com role 'admin'
    await client.query(`
      INSERT INTO public.izaque_profiles (id, full_name, email, role)
      VALUES ($1, 'Thiago Prata', $2, 'admin')
      ON CONFLICT (id) DO UPDATE
      SET full_name = 'Thiago Prata', email = $2, role = 'admin', updated_at = now();
    `, [userId, thiagoEmail]);
    console.log('✅ Perfil em public.izaque_profiles atualizado como role: admin');

    // 3. Atualizar membro na equipe do projeto
    await client.query(`
      UPDATE public.izaque_project_members
      SET email = $1, name = 'Thiago Prata', role_title = 'Líder Técnico & Gestor do Projeto'
      WHERE name ILIKE '%thiago%';
    `, [thiagoEmail]);
    console.log('✅ Membro em public.izaque_project_members atualizado com o e-mail oficial.');

    // 4. Disparar e-mail com as credenciais via Hostinger SMTP
    console.log(`✉️ Enviando credenciais para ${thiagoEmail} via SMTP...`);
    const transporter = getEmailTransporter();
    const fromAddress = `"Ecossistema IZAQUE" <suporte@lynxems.com.br>`;

    const mailOptions = {
      from: fromAddress,
      to: thiagoEmail,
      subject: '🌿 Suas Credenciais de Acesso ao IZAQUE',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #faf9f6; padding: 32px 20px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">IZAQUE</h1>
            <p style="color: #78716c; font-size: 13px; margin-top: 4px; font-weight: 500;">Espaço de Mentoria & Governança do Projeto</p>
          </div>

          <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #f0eeeb; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
            <h2 style="font-size: 18px; color: #1c1917; margin-top: 0; margin-bottom: 12px;">Olá, Thiago!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 20px;">
              Seu acesso administrativo ao ecossistema <strong>IZAQUE</strong> foi configurado com sucesso. Abaixo estão suas credenciais para login:
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;"><strong>E-mail de Login:</strong></td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${thiagoEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;"><strong>Senha de Acesso:</strong></td>
                  <td style="padding: 8px 0; color: #0f766e; font-weight: 700; font-family: monospace; font-size: 16px; text-align: right;">${newPassword}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;"><strong>Nível de Acesso:</strong></td>
                  <td style="padding: 8px 0; color: #0f172a; text-align: right;">Administrador (Super Admin)</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="https://issac.lynxems.com.br" style="display: inline-block; background-color: #0f766e; color: #ffffff; padding: 14px 28px; border-radius: 14px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);">
                Acessar Painel do IZAQUE →
              </a>
            </div>

            <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 14px 16px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; color: #115e59; line-height: 1.5;">
                <strong>Endereços disponíveis:</strong><br>
                • Ambiente de Revisão: <a href="https://issac.lynxems.com.br" style="color: #0f766e;">https://issac.lynxems.com.br</a><br>
                • Produção Oficial: <a href="https://izaque.lynxems.com.br" style="color: #0f766e;">https://izaque.lynxems.com.br</a>
              </p>
            </div>

            <p style="font-size: 12px; line-height: 1.5; color: #a8a29e; margin-bottom: 0;">
              Por segurança, você pode alterar sua senha a qualquer momento dentro do seu perfil no aplicativo.
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #a8a29e;">
            © ${new Date().getFullYear()} IZAQUE Mentoria & Governança. Todos os direitos reservados.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`🎉 E-mail enviado com sucesso para ${thiagoEmail}! Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await client.end();
  }
}

run();
