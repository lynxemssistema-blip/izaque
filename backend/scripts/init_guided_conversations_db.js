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
  console.log('🔄 [Guided Conversations DB] Iniciando migração para Conversas Direcionadas...');

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
    // 1. Cria a tabela de conversas direcionadas
    console.log('⏳ 1. Criando tabela public.izaque_guided_conversations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_guided_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'Geral',
        icon TEXT NOT NULL DEFAULT 'Compass',
        agent_slug TEXT NOT NULL DEFAULT 'izaque-master',
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Índices
    console.log('⏳ 2. Criando índices para performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guided_conv_is_active 
        ON public.izaque_guided_conversations(is_active);
      CREATE INDEX IF NOT EXISTS idx_guided_conv_order 
        ON public.izaque_guided_conversations(order_index ASC, created_at DESC);
    `);

    // 3. RLS para conversas direcionadas
    console.log('⏳ 3. Configurando políticas de RLS...');
    await client.query(`
      ALTER TABLE public.izaque_guided_conversations ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_guided_conversations' AND policyname = 'Qualquer usuário autenticado pode ver conversas direcionadas ativas'
        ) THEN
          CREATE POLICY "Qualquer usuário autenticado pode ver conversas direcionadas ativas"
            ON public.izaque_guided_conversations FOR SELECT
            USING (
              is_active = true 
              OR EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_guided_conversations' AND policyname = 'Apenas superadmin pode inserir conversas direcionadas'
        ) THEN
          CREATE POLICY "Apenas superadmin pode inserir conversas direcionadas"
            ON public.izaque_guided_conversations FOR INSERT
            WITH CHECK (
              EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_guided_conversations' AND policyname = 'Apenas superadmin pode atualizar conversas direcionadas'
        ) THEN
          CREATE POLICY "Apenas superadmin pode atualizar conversas direcionadas"
            ON public.izaque_guided_conversations FOR UPDATE
            USING (
              EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_guided_conversations' AND policyname = 'Apenas superadmin pode excluir conversas direcionadas'
        ) THEN
          CREATE POLICY "Apenas superadmin pode excluir conversas direcionadas"
            ON public.izaque_guided_conversations FOR DELETE
            USING (
              EXISTS (SELECT 1 FROM public.izaque_profiles WHERE id = auth.uid() AND role = 'superadmin')
            );
        END IF;
      END $$;
    `);

    // 4. Seed de conversas direcionadas iniciais se tabela estiver vazia
    console.log('⏳ 4. Verificando dados iniciais de conversas direcionadas...');
    const countRes = await client.query('SELECT count(*) FROM public.izaque_guided_conversations');
    const count = parseInt(countRes.rows[0].count, 10);

    if (count === 0) {
      console.log('🌱 Populando conversas direcionadas modelo...');
      const seedTopics = [
        {
          title: 'Superação da Autossabotagem & Procrastinação',
          description: 'Identifique os medos ocultos e crenças limitantes que te fazem adiar suas prioridades essenciais de vida.',
          category: 'Foco & Disciplina',
          icon: 'Zap',
          agent_slug: 'izaque-master',
          order_index: 1,
          questions: JSON.stringify([
            { id: 'q1', text: 'Qual projeto ou decisão importante você está adiando há mais tempo e por quê?' },
            { id: 'q2', text: 'O que você teme que aconteça se você realmente se dedicar e falhar — ou se você tiver sucesso estrondoso?' },
            { id: 'q3', text: 'Qual é o menor passo real de 5 minutos que você pode dar hoje para quebrar esse ciclo de estagnação?' }
          ])
        },
        {
          title: 'Prevenção de Recaída & Manejo de Fissuras',
          description: 'Estratégia prática e acolhimento firme para identificar gatilhos de vulnerabilidade e proteger sua sobriedade.',
          category: 'Sobriedade',
          icon: 'Shield',
          agent_slug: 'renato-sobriedade',
          order_index: 2,
          questions: JSON.stringify([
            { id: 'q1', text: 'Quais situações, emoções ou companhias recentes despertaram a vontade de beber ou usar substâncias?' },
            { id: 'q2', text: 'Qual plano de contingência ou protocolo de emergência você pode acionar quando a fissura vier forte?' },
            { id: 'q3', text: 'O que te dá forças para manter a sobriedade apenas pelo dia de hoje?' }
          ])
        },
        {
          title: 'Alinhamento Financeiro & Mentalidade de Abundância',
          description: 'Desbloqueie crenças de escassez e estruture um plano objetivo para gerar valor, cobrar bem e prosperar.',
          category: 'Finanças',
          icon: 'TrendingUp',
          agent_slug: 'mentor-financeiro',
          order_index: 3,
          questions: JSON.stringify([
            { id: 'q1', text: 'Qual é a sua relação com dinheiro hoje: você se sente no controle ou sobrecarregado por ele?' },
            { id: 'q2', text: 'Existe alguma culpa ou desconforto quando você pensa em cobrar pelo seu valor e enriquecer?' },
            { id: 'q3', text: 'Qual é o seu principal objetivo financeiro para os próximos 6 meses?' }
          ])
        },
        {
          title: 'Paz Interior & Direção Espiritual',
          description: 'Encontre discernimento, acalme o coração aflito e renove suas forças nas Escrituras Sagradas.',
          category: 'Espiritualidade',
          icon: 'Heart',
          agent_slug: 'pastor-joao-biblico',
          order_index: 4,
          questions: JSON.stringify([
            { id: 'q1', text: 'Qual peso ou ansiedade você precisa entregar a Deus hoje para encontrar paz de espírito?' },
            { id: 'q2', text: 'Em que área da sua vida você sente maior necessidade de discernimento e sabedoria divina?' },
            { id: 'q3', text: 'Como você pode cultivar momentos diários de silêncio, oração e gratidão nesta semana?' }
          ])
        }
      ];

      for (const t of seedTopics) {
        await client.query(`
          INSERT INTO public.izaque_guided_conversations (
            title, description, category, icon, agent_slug, order_index, questions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        `, [t.title, t.description, t.category, t.icon, t.agent_slug, t.order_index, t.questions]);
      }
      console.log('✅ 4 conversas direcionadas inseridas com sucesso!');
    } else {
      console.log(`ℹ️ Tabela já possui ${count} conversas direcionadas.`);
    }

    console.log('🎉 Migração de conversas direcionadas concluída!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
