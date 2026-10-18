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
    console.log('✅ Conectado ao Supabase PostgreSQL');

    // 1. Adicionar show_creative_troubles em izaque_system_settings
    console.log('⏳ 1. Adicionando show_creative_troubles em public.izaque_system_settings...');
    await client.query(`
      ALTER TABLE public.izaque_system_settings
        ADD COLUMN IF NOT EXISTS show_creative_troubles BOOLEAN DEFAULT true;

      UPDATE public.izaque_system_settings
      SET show_creative_troubles = true
      WHERE show_creative_troubles IS NULL;
    `);

    // 2. Adicionar colunas de aceite de termos em public.izaque_profiles
    console.log('⏳ 2. Adicionando colunas de termos em public.izaque_profiles...');
    await client.query(`
      ALTER TABLE public.izaque_profiles
        ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0-beta-2026';
    `);

    // 3. Criar tabela de auditoria forense de termos (prova jurídica irrefutável)
    console.log('⏳ 3. Criando tabela public.izaque_terms_acceptances...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_terms_acceptances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        terms_version TEXT NOT NULL DEFAULT 'v1.0-beta-2026',
        accepted BOOLEAN NOT NULL DEFAULT true,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE public.izaque_terms_acceptances ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can insert their own terms acceptance" ON public.izaque_terms_acceptances;
      CREATE POLICY "Users can insert their own terms acceptance"
        ON public.izaque_terms_acceptances FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can view their own terms acceptance" ON public.izaque_terms_acceptances;
      CREATE POLICY "Users can view their own terms acceptance"
        ON public.izaque_terms_acceptances FOR SELECT
        USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Admins can view all terms acceptances" ON public.izaque_terms_acceptances;
      CREATE POLICY "Admins can view all terms acceptances"
        ON public.izaque_terms_acceptances FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.izaque_profiles
            WHERE id = auth.uid() AND role IN ('master', 'admin')
          )
        );
    `);

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await client.end();
  }
}

runMigration();
