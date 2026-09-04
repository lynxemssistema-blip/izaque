import pg from 'pg';

const password = '10207597Rdv*';
const projectRef = 'ohjuqcrpakswvnoqobiq';

const adminEmail = 'edsonmanoel2012@gmail.com';
const adminPassword = '10207597Rdv*';

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: password,
  ssl: { rejectUnauthorized: false },
});

async function setupSuperAdmin() {
  await client.connect();
  console.log(`📡 Conectado ao Supabase para configurar o Super Admin: ${adminEmail}`);

  try {
    // 1. Criar trigger para auto-inserir em public.izaque_profiles quando o usuário se registra em auth.users
    const triggerSQL = `
      -- Função para sincronizar auth.users com public.izaque_profiles
      create or replace function public.handle_new_izaque_user()
      returns trigger
      language plpgsql
      security definer set search_path = public
      as $$
      begin
        insert into public.izaque_profiles (id, full_name, email, role)
        values (
          new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          new.email,
          case 
            when lower(new.email) = 'edsonmanoel2012@gmail.com' then 'master'
            else 'user'
          end
        )
        on conflict (id) do update
        set 
          role = case when lower(excluded.email) = 'edsonmanoel2012@gmail.com' then 'master' else izaque_profiles.role end,
          email = excluded.email,
          updated_at = now();
        return new;
      end;
      $$;

      -- Trigger disparado após inserção em auth.users
      drop trigger if exists on_auth_user_created_izaque on auth.users;
      create trigger on_auth_user_created_izaque
        after insert or update on auth.users
        for each row execute function public.handle_new_izaque_user();
    `;

    await client.query(triggerSQL);
    console.log('✅ Trigger de auto-perfil sincronizado em auth.users!');

    // 2. Verificar se o usuário já existe em auth.users
    const checkUser = await client.query('select id, email from auth.users where email = $1', [adminEmail]);

    let userId;
    if (checkUser.rows.length === 0) {
      console.log(`👤 Usuário não existia em auth.users. Criando agora com e-mail confirmado...`);
      // Extensão pgcrypto para gerar hash bcrypt
      await client.query('create extension if not exists pgcrypto;');

      const insertUserSQL = `
        insert into auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        ) values (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          $1,
          crypt($2, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          '{"full_name":"Edson Manoel (Super Admin)"}',
          now(),
          now()
        )
        returning id;
      `;
      const newUserRes = await client.query(insertUserSQL, [adminEmail, adminPassword]);
      userId = newUserRes.rows[0].id;
      console.log(`✅ Usuário criado com sucesso em auth.users (ID: ${userId})`);
    } else {
      userId = checkUser.rows[0].id;
      console.log(`ℹ️ Usuário já existia em auth.users (ID: ${userId}). Atualizando senha e confirmação...`);
      await client.query(`
        update auth.users
        set 
          encrypted_password = crypt($2, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{full_name}', '"Edson Manoel (Super Admin)"')
        where id = $1
      `, [userId, adminPassword]);
      console.log(`✅ Senha do Super Admin atualizada com sucesso!`);
    }

    // 3. Garantir que o perfil em public.izaque_profiles tem role 'master'
    await client.query(`
      insert into public.izaque_profiles (id, full_name, email, role)
      values ($1, 'Edson Manoel (Super Admin)', $2, 'master')
      on conflict (id) do update 
      set role = 'master', full_name = 'Edson Manoel (Super Admin)', email = $2;
    `, [userId, adminEmail]);

    console.log(`👑 Perfil configurado em public.izaque_profiles com role = 'master'!`);

    // 4. Verificação final
    const profileCheck = await client.query(`
      select id, full_name, email, role, created_at 
      from public.izaque_profiles 
      where email = $1;
    `, [adminEmail]);

    console.log('\n====================================================');
    console.log('🎉 SUPER ADMIN CONFIGURADO COM SUCESSO!');
    console.log(profileCheck.rows[0]);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Erro ao configurar Super Admin:', err.message);
  } finally {
    await client.end();
  }
}

setupSuperAdmin();
