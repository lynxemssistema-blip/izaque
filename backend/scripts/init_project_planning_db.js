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
  console.log('🔄 [Project Planning DB] Iniciando migração de tabelas para Gestão de Projetos, Membros e Cronograma...');

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
    console.error('❌ Não foi possível conectar ao banco PostgreSQL do Supabase.');
    process.exit(1);
  }

  try {
    // 1. Tabela de Membros Executores da Equipe do Projeto
    console.log('⏳ 1. Criando tabela public.izaque_project_members...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role_title TEXT NOT NULL DEFAULT 'Responsável Técnico',
        phone TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Tabela de Etapas / Marcos do Projeto (Milestones / Sprints / Fases)
    console.log('⏳ 2. Criando tabela public.izaque_project_milestones...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_project_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress', -- 'planned', 'in_progress', 'completed', 'paused'
        start_date DATE,
        target_date DATE,
        completed_date DATE,
        order_index INT NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#0f766e',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 3. Tabela de Atividades / Tarefas do Projeto
    console.log('⏳ 3. Criando tabela public.izaque_project_tasks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_project_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        milestone_id UUID REFERENCES public.izaque_project_milestones(id) ON DELETE SET NULL,
        assigned_member_id UUID REFERENCES public.izaque_project_members(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'in_review', 'completed', 'blocked'
        priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
        start_date DATE,
        due_date DATE,
        completed_at TIMESTAMPTZ,
        checklist JSONB DEFAULT '[]'::jsonb,
        notified_pre_at TIMESTAMPTZ,
        notified_due_at TIMESTAMPTZ,
        notified_completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 4. Tabela de Logs de Notificação e Cobrança por E-mail
    console.log('⏳ 4. Criando tabela public.izaque_project_notifications_log...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_project_notifications_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES public.izaque_project_tasks(id) ON DELETE SET NULL,
        member_id UUID REFERENCES public.izaque_project_members(id) ON DELETE SET NULL,
        type TEXT NOT NULL, -- 'reminder_pre', 'reminder_due', 'task_completed', 'manual_notice'
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
        sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        error_message TEXT
      );
    `);

    // 5. Índices de Performance
    console.log('⏳ 5. Criando índices de performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_members_email ON public.izaque_project_members(email);
      CREATE INDEX IF NOT EXISTS idx_project_members_active ON public.izaque_project_members(is_active);
      CREATE INDEX IF NOT EXISTS idx_project_tasks_milestone ON public.izaque_project_tasks(milestone_id);
      CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON public.izaque_project_tasks(assigned_member_id);
      CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.izaque_project_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON public.izaque_project_tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_project_notif_task ON public.izaque_project_notifications_log(task_id);
      CREATE INDEX IF NOT EXISTS idx_project_notif_sent ON public.izaque_project_notifications_log(sent_at DESC);
    `);

    // 6. Políticas de RLS
    console.log('⏳ 6. Configurando RLS...');
    await client.query(`
      ALTER TABLE public.izaque_project_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_project_milestones ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_project_tasks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_project_notifications_log ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_project_members' AND policyname = 'Admin all on izaque_project_members'
        ) THEN
          CREATE POLICY "Admin all on izaque_project_members" ON public.izaque_project_members
          FOR ALL TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.izaque_profiles
              WHERE id = auth.uid() AND role IN ('master', 'admin')
            )
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_project_milestones' AND policyname = 'Admin all on izaque_project_milestones'
        ) THEN
          CREATE POLICY "Admin all on izaque_project_milestones" ON public.izaque_project_milestones
          FOR ALL TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.izaque_profiles
              WHERE id = auth.uid() AND role IN ('master', 'admin')
            )
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_project_tasks' AND policyname = 'Admin all on izaque_project_tasks'
        ) THEN
          CREATE POLICY "Admin all on izaque_project_tasks" ON public.izaque_project_tasks
          FOR ALL TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.izaque_profiles
              WHERE id = auth.uid() AND role IN ('master', 'admin')
            )
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_project_notifications_log' AND policyname = 'Admin all on izaque_project_notifications_log'
        ) THEN
          CREATE POLICY "Admin all on izaque_project_notifications_log" ON public.izaque_project_notifications_log
          FOR ALL TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.izaque_profiles
              WHERE id = auth.uid() AND role IN ('master', 'admin')
            )
          );
        END IF;
      END
      $$;

      GRANT ALL ON public.izaque_project_members TO postgres, service_role, authenticated;
      GRANT ALL ON public.izaque_project_milestones TO postgres, service_role, authenticated;
      GRANT ALL ON public.izaque_project_tasks TO postgres, service_role, authenticated;
      GRANT ALL ON public.izaque_project_notifications_log TO postgres, service_role, authenticated;
    `);

    // 7. Seed Inicial: Etapa 1 e Membro Inicial Thiago
    console.log('⏳ 7. Inserindo dados iniciais da Revisão Thiago...');
    
    // Membro Thiago
    const memberRes = await client.query(`
      INSERT INTO public.izaque_project_members (name, email, role_title, is_active)
      VALUES ('Thiago', 'thiago@lynxems.com.br', 'Líder Técnico & Gestor do Projeto', true)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);

    let thiagoId = memberRes.rows[0]?.id;
    if (!thiagoId) {
      const existing = await client.query(`SELECT id FROM public.izaque_project_members WHERE name = 'Thiago' LIMIT 1;`);
      thiagoId = existing.rows[0]?.id;
    }

    // Milestone 1
    const milestoneRes = await client.query(`
      INSERT INTO public.izaque_project_milestones (title, description, status, start_date, target_date, order_index, color)
      VALUES (
        'Fase 1: Revisão Thiago & Painel de Governança',
        'Estruturação da nova versão do Izaque, módulo de cronograma, gestão de tarefas da equipe e disparo de cobranças por e-mail.',
        'in_progress',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '14 days',
        1,
        '#0f766e'
      )
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);

    let milestoneId = milestoneRes.rows[0]?.id;
    if (!milestoneId) {
      const existingM = await client.query(`SELECT id FROM public.izaque_project_milestones WHERE title LIKE 'Fase 1%' LIMIT 1;`);
      milestoneId = existingM.rows[0]?.id;
    }

    // Tarefas Iniciais
    if (milestoneId) {
      await client.query(`
        INSERT INTO public.izaque_project_tasks (milestone_id, assigned_member_id, title, description, status, priority, start_date, due_date)
        VALUES 
        (
          $1, $2,
          'Criar tela de Planejamento & Cronograma no Super Admin',
          'Desenvolver componente completo com visão de Roadmap, Kanban, lista de tarefas e gestão de membros responsáveis.',
          'in_progress',
          'high',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '2 days'
        ),
        (
          $1, $2,
          'Implementar motor de disparo de e-mails para cobrança de prazos',
          'Disparar e-mail de lembrete D-2 e D-0 antes do vencimento da tarefa para o responsável e avisar quando concluída.',
          'in_progress',
          'high',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '3 days'
        ),
        (
          $1, $2,
          'Revisão de Layout & Novas Telas da Versão Thiago',
          'Desenvolver melhorias de usabilidade e novidades visuais isoladas exclusivamente para o usuário master.',
          'pending',
          'medium',
          CURRENT_DATE + INTERVAL '3 days',
          CURRENT_DATE + INTERVAL '10 days'
        )
        ON CONFLICT DO NOTHING;
      `, [milestoneId, thiagoId]);
    }

    console.log('✅ Migração de Planejamento de Projetos concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração de Planejamento de Projetos:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
