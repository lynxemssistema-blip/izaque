import pg from 'pg';

const password = '10207597Rdv*';
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
  console.log('🔄 [Multi-Session DB] Iniciando migração de sessões de conversa...');

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
    // 1. Cria a tabela de sessões
    console.log('⏳ 1. Criando tabela public.izaque_chat_sessions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Nova Reflexão',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Índices
    console.log('⏳ 2. Criando índices para performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_izaque_chat_sessions_user_id 
        ON public.izaque_chat_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_izaque_chat_sessions_updated_at 
        ON public.izaque_chat_sessions(updated_at DESC);
    `);

    // 3. RLS para sessões
    console.log('⏳ 3. Configurando políticas de RLS...');
    await client.query(`
      ALTER TABLE public.izaque_chat_sessions ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_chat_sessions' AND policyname = 'Usuários podem ver suas próprias sessões'
        ) THEN
          CREATE POLICY "Usuários podem ver suas próprias sessões"
            ON public.izaque_chat_sessions FOR SELECT
            USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_chat_sessions' AND policyname = 'Usuários podem criar suas próprias sessões'
        ) THEN
          CREATE POLICY "Usuários podem criar suas próprias sessões"
            ON public.izaque_chat_sessions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_chat_sessions' AND policyname = 'Usuários podem atualizar suas próprias sessões'
        ) THEN
          CREATE POLICY "Usuários podem atualizar suas próprias sessões"
            ON public.izaque_chat_sessions FOR UPDATE
            USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_chat_sessions' AND policyname = 'Usuários podem excluir suas próprias sessões'
        ) THEN
          CREATE POLICY "Usuários podem excluir suas próprias sessões"
            ON public.izaque_chat_sessions FOR DELETE
            USING (auth.uid() = user_id);
        END IF;
      END $$;
    `);

    // 4. Adiciona session_id em izaque_messages
    console.log('⏳ 4. Adicionando coluna session_id em public.izaque_messages...');
    await client.query(`
      ALTER TABLE public.izaque_messages
        ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.izaque_chat_sessions(id) ON DELETE CASCADE;

      CREATE INDEX IF NOT EXISTS idx_izaque_messages_session_id 
        ON public.izaque_messages(session_id);
    `);

    // 5. Migração retrocompatível de dados existentes
    console.log('⏳ 5. Migrando mensagens legadas para uma sessão padrão "Conversa Principal"...');
    const migrationRes = await client.query(`
      DO $$
      DECLARE
        r RECORD;
        new_sess_id UUID;
      BEGIN
        FOR r IN (SELECT DISTINCT user_id FROM public.izaque_messages WHERE session_id IS NULL) LOOP
          INSERT INTO public.izaque_chat_sessions (user_id, title)
          VALUES (r.user_id, 'Conversa Principal')
          RETURNING id INTO new_sess_id;

          UPDATE public.izaque_messages
          SET session_id = new_sess_id
          WHERE user_id = r.user_id AND session_id IS NULL;
        END LOOP;
      END $$;
    `);

    console.log('✅ Migração de sessões de conversa concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
  }
}

runMigration();
