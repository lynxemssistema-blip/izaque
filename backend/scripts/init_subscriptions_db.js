import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase PostgreSQL para migração de planos e assinaturas');

    // 1. Colunas em izaque_profiles
    console.log('⏳ 1. Atualizando colunas em public.izaque_profiles...');
    await client.query(`
      ALTER TABLE public.izaque_profiles
        ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
    `);

    // 2. Tabela de Planos editáveis pelo Superadmin
    console.log('⏳ 2. Criando tabela public.izaque_plans...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        billing_cycle TEXT NOT NULL,
        description TEXT,
        features JSONB DEFAULT '[]'::jsonb,
        pix_key TEXT DEFAULT 'suporte@lynxems.com.br',
        pix_key_type TEXT DEFAULT 'email',
        pix_beneficiary TEXT DEFAULT 'Lynx EMS Soluções Tecnológicas',
        activation_notice TEXT DEFAULT 'O pagamento é realizado exclusivamente via PIX. A ativação do plano pode demorar até 10 minutos após o pagamento para confirmação do sistema.',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Popula os planos iniciais
    console.log('⏳ 2.1. Inserindo planos base (Mensal e Anual)...');
    await client.query(`
      INSERT INTO public.izaque_plans (id, name, price, billing_cycle, description, features, pix_key, pix_key_type, pix_beneficiary, activation_notice, is_active)
      VALUES 
      (
        'pro_monthly',
        'Caminho da Paz (Mensal)',
        29.90,
        'monthly',
        'Refúgio diário com voz neural imersiva e memória profunda.',
        '["Conversas diárias sem restrições", "Voz neural realista do Gemini (Charon e Aoede)", "Memória contínua com histórico completo", "Todas as frequências sonoras (432Hz, chuva, sinos)", "Canal exclusivo de suporte direto com a Lynx"]'::jsonb,
        'suporte@lynxems.com.br',
        'email',
        'Lynx EMS Soluções Tecnológicas',
        'O pagamento é realizado exclusivamente via PIX. A ativação do plano pode demorar até 10 minutos após o pagamento para confirmação do sistema.',
        true
      ),
      (
        'pro_annual',
        'Santuário Pleno (Anual)',
        247.00,
        'annual',
        'A experiência máxima de mentoria com desconto de 30% e benefícios exclusivos.',
        '["Tudo do Plano Mensal com economia de mais de 30%", "Voz neural ilimitada para todas as reflexões", "Prioridade nos modelos neurais mais rápidos", "Canal de suporte e sugestões prioritário Lynx", "Acesso antecipado a novos mentores e estudos"]'::jsonb,
        'suporte@lynxems.com.br',
        'email',
        'Lynx EMS Soluções Tecnológicas',
        'O pagamento é realizado exclusivamente via PIX. A ativação do plano pode demorar até 10 minutos após o pagamento para confirmação do sistema.',
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        activation_notice = EXCLUDED.activation_notice;
    `);

    // 3. Tabela de Pedidos / Transações PIX (izaque_subscriptions)
    console.log('⏳ 3. Criando tabela public.izaque_subscriptions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        user_email TEXT,
        user_name TEXT,
        plan_id TEXT REFERENCES public.izaque_plans(id) ON DELETE SET NULL,
        amount NUMERIC(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        pix_key_used TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        approved_at TIMESTAMPTZ,
        approved_by UUID
      );

      CREATE INDEX IF NOT EXISTS idx_izaque_subscriptions_user_id ON public.izaque_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_izaque_subscriptions_status ON public.izaque_subscriptions(status);
    `);

    // 4. Tabela de Feedbacks / Reclamações de Assinantes (izaque_feedbacks)
    console.log('⏳ 4. Criando tabela public.izaque_feedbacks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        user_name TEXT,
        user_plan TEXT DEFAULT 'free',
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_izaque_feedbacks_user_id ON public.izaque_feedbacks(user_id);
    `);

    // 5. RLS e Políticas
    console.log('⏳ 5. Configurando RLS e permissões de segurança...');
    await client.query(`
      ALTER TABLE public.izaque_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_subscriptions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_feedbacks ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Public can view active plans" ON public.izaque_plans;
      CREATE POLICY "Public can view active plans" ON public.izaque_plans
        FOR SELECT TO anon, authenticated USING (is_active = true);

      DROP POLICY IF EXISTS "Users can view their subscriptions" ON public.izaque_subscriptions;
      CREATE POLICY "Users can view their subscriptions" ON public.izaque_subscriptions
        FOR SELECT TO authenticated USING ( (select auth.uid()) = user_id );

      DROP POLICY IF EXISTS "Users can insert their subscriptions" ON public.izaque_subscriptions;
      CREATE POLICY "Users can insert their subscriptions" ON public.izaque_subscriptions
        FOR INSERT TO authenticated WITH CHECK ( (select auth.uid()) = user_id );

      DROP POLICY IF EXISTS "Users can insert their feedback" ON public.izaque_feedbacks;
      CREATE POLICY "Users can insert their feedback" ON public.izaque_feedbacks
        FOR INSERT TO authenticated WITH CHECK ( (select auth.uid()) = user_id );

      DROP POLICY IF EXISTS "Users can view their feedback" ON public.izaque_feedbacks;
      CREATE POLICY "Users can view their feedback" ON public.izaque_feedbacks
        FOR SELECT TO authenticated USING ( (select auth.uid()) = user_id );

      GRANT SELECT ON public.izaque_plans TO anon, authenticated;
      GRANT SELECT, INSERT ON public.izaque_subscriptions TO authenticated;
      GRANT SELECT, INSERT ON public.izaque_feedbacks TO authenticated;
    `);

    console.log('✨ Migração do banco de dados concluída com absoluto sucesso!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração do banco de dados:', error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
