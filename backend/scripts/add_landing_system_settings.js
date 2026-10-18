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

    console.log('⏳ Adicionando colunas de visibilidade da Página Inicial em public.izaque_system_settings...');
    await client.query(`
      ALTER TABLE public.izaque_system_settings
        ADD COLUMN IF NOT EXISTS show_creative_troubles BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS show_landing_creator BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS show_landing_sensations BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS show_landing_features BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS show_landing_security BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS show_landing_steps BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS show_landing_cta BOOLEAN DEFAULT true;

      UPDATE public.izaque_system_settings
      SET 
        show_creative_troubles = COALESCE(show_creative_troubles, true),
        show_landing_creator = COALESCE(show_landing_creator, true),
        show_landing_sensations = COALESCE(show_landing_sensations, true),
        show_landing_features = COALESCE(show_landing_features, true),
        show_landing_security = COALESCE(show_landing_security, true),
        show_landing_steps = COALESCE(show_landing_steps, true),
        show_landing_cta = COALESCE(show_landing_cta, true)
      WHERE id = 'global';
    `);

    console.log('✅ Colunas de visibilidade da página inicial adicionadas e populadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração de parâmetros da landing page:', error);
  } finally {
    await client.end();
  }
}

runMigration();
