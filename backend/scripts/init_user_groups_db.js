import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || '10207597Rdv*';
const projectRef = 'ohjuqcrpakswvnoqobiq';

const connectionAttempts = [
  {
    name: 'Conexão Direta (db.ohjuqcrpakswvnoqobiq.supabase.co:5432)',
    config: {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'Pooler de Conexão (aws-0-sa-east-1.pooler.supabase.com:6543)',
    config: {
      host: 'aws-0-sa-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'Pooler de Conexão (aws-0-us-east-1.pooler.supabase.com:6543)',
    config: {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
];

async function runMigration() {
  console.log('🔄 [User Groups & Broadcasts DB] Iniciando migração para Grupos de Usuários e Disparos...');

  let client = null;
  for (const attempt of connectionAttempts) {
    try {
      console.log(`📡 Tentando ${attempt.name}...`);
      const testClient = new pg.Client(attempt.config);
      await testClient.connect();
      client = testClient;
      console.log(`✅ Conectado com sucesso via: ${attempt.name}`);
      break;
    } catch (err) {
      console.warn(`⚠️ Falha ao conectar em ${attempt.name}: ${err.message}`);
    }
  }

  if (!client) {
    console.error('❌ Não foi possível conectar a nenhuma porta do banco PostgreSQL.');
    process.exit(1);
  }

  try {
    // 1. Tabela de Grupos de Usuários
    console.log('⏳ 1. Criando tabela public.izaque_user_groups...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_user_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#0f766e',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Tabela Associativa N:N (Membros dos Grupos)
    console.log('⏳ 2. Criando tabela public.izaque_user_group_members...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_user_group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES public.izaque_user_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(group_id, user_id)
      );
    `);

    // 3. Tabela de Disparos de Áudio e Texto por Grupo
    console.log('⏳ 3. Criando tabela public.izaque_group_broadcasts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_group_broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT,
        audio_url TEXT,
        target_group_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 4. Tabela de Notificações / Mensagens In-App para Usuários
    console.log('⏳ 4. Criando tabela public.izaque_user_notifications...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_user_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        broadcast_id UUID REFERENCES public.izaque_group_broadcasts(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        audio_url TEXT,
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 5. Índices de Performance
    console.log('⏳ 5. Criando índices de performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.izaque_user_group_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.izaque_user_group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.izaque_user_notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON public.izaque_user_notifications(created_at DESC);
    `);

    // 6. Políticas de RLS
    console.log('⏳ 6. Configurando políticas de RLS...');
    await client.query(`
      ALTER TABLE public.izaque_user_groups ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_user_group_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_group_broadcasts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_user_notifications ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        -- Grupos: Leitura para autenticados, gestão para superadmin
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_user_groups' AND policyname = 'Qualquer autenticado pode ver grupos'
        ) THEN
          CREATE POLICY "Qualquer autenticado pode ver grupos"
            ON public.izaque_user_groups FOR SELECT
            USING (auth.role() = 'authenticated');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_user_groups' AND policyname = 'Superadmin pode gerenciar grupos'
        ) THEN
          CREATE POLICY "Superadmin pode gerenciar grupos"
            ON public.izaque_user_groups FOR ALL
            USING (EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin'))
            WITH CHECK (EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin'));
        END IF;

        -- Membros dos Grupos
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_user_group_members' AND policyname = 'Membros visiveis por usuario ou superadmin'
        ) THEN
          CREATE POLICY "Membros visiveis por usuario ou superadmin"
            ON public.izaque_user_group_members FOR SELECT
            USING (
              auth.uid() = user_id 
              OR EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_user_group_members' AND policyname = 'Superadmin gerencia membros dos grupos'
        ) THEN
          CREATE POLICY "Superadmin gerencia membros dos grupos"
            ON public.izaque_user_group_members FOR ALL
            USING (EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin'))
            WITH CHECK (EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin'));
        END IF;

        -- Notificações do Usuário
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_user_notifications' AND policyname = 'Usuario ve suas proprias notificacoes'
        ) THEN
          CREATE POLICY "Usuario ve suas proprias notificacoes"
            ON public.izaque_user_notifications FOR SELECT
            USING (
              auth.uid() = user_id
              OR EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_user_notifications' AND policyname = 'Usuario marca notificacao como lida'
        ) THEN
          CREATE POLICY "Usuario marca notificacao como lida"
            ON public.izaque_user_notifications FOR UPDATE
            USING (auth.uid() = user_id);
        END IF;
      END $$;
    `);

    // 7. Bucket de Storage para Áudios de Broadcasts
    console.log('⏳ 7. Configurando bucket de storage para áudios de broadcast...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('broadcasts', 'broadcasts', true)
      ON CONFLICT (id) DO NOTHING;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Acesso publico para leitura de broadcasts'
        ) THEN
          CREATE POLICY "Acesso publico para leitura de broadcasts"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'broadcasts');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Autenticado faz upload em broadcasts'
        ) THEN
          CREATE POLICY "Autenticado faz upload em broadcasts"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'broadcasts' AND auth.role() = 'authenticated');
        END IF;
      END $$;
    `);

    // 8. Seed inicial de grupos padrão caso tabela esteja vazia
    console.log('⏳ 8. Verificando grupos iniciais...');
    const groupsCountRes = await client.query('SELECT count(*) FROM public.izaque_user_groups');
    const groupsCount = parseInt(groupsCountRes.rows[0].count, 10);

    if (groupsCount === 0) {
      console.log('🌱 Populando grupos padrão do sistema...');
      const seedGroups = [
        {
          name: 'Sobriedade & Recuperação',
          description: 'Membros em jornada de superação de vícios e manutenção da sobriedade.',
          color: '#059669',
        },
        {
          name: 'Liderança & Carreira',
          description: 'Empreendedores, gestores e profissionais em busca de clareza e direção estratégica.',
          color: '#2563eb',
        },
        {
          name: 'Espiritualidade & Fé',
          description: 'Pessoas focadas em paz interior, oração e fortalecimento espiritual diário.',
          color: '#7c3aed',
        },
        {
          name: 'Assinantes VIP Pro',
          description: 'Usuários ativos com planos contratados e mentoria contínua.',
          color: '#d97706',
        },
      ];

      for (const g of seedGroups) {
        await client.query(
          `INSERT INTO public.izaque_user_groups (name, description, color) VALUES ($1, $2, $3)`,
          [g.name, g.description, g.color]
        );
      }
      console.log('✅ 4 grupos padrão criados!');
    } else {
      console.log(`ℹ️ Tabela já possui ${groupsCount} grupo(s).`);
    }

    console.log('🎉 Migração de Grupos de Usuários e Disparos concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração de grupos:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
