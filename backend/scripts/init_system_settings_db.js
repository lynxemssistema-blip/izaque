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
    console.log('✅ Conectado ao Supabase PostgreSQL para migração de Parâmetros Avançados (Sistema)');

    console.log('⏳ Criando tabela public.izaque_system_settings...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_system_settings (
        id TEXT PRIMARY KEY DEFAULT 'global',
        show_theme_selector BOOLEAN DEFAULT true,
        show_settings_button BOOLEAN DEFAULT true,
        show_ambient_sound_button BOOLEAN DEFAULT true,
        default_theme TEXT DEFAULT 'gold',
        default_guide_name TEXT DEFAULT 'Izaque',
        default_ambient_track TEXT DEFAULT '432hz',
        default_ambient_volume NUMERIC(5,2) DEFAULT 0.20,
        default_ambient_enabled BOOLEAN DEFAULT false,
        default_voice_engine TEXT DEFAULT 'gemini',
        default_gemini_voice TEXT DEFAULT 'Charon',
        default_immersive_voice BOOLEAN DEFAULT false,
        updated_at TIMESTAMPTZ DEFAULT now(),
        updated_by TEXT
      );
    `);

    console.log('⏳ Inserindo ou garantindo linha padrão com tema ouro sagrado do Edson...');
    await client.query(`
      INSERT INTO public.izaque_system_settings (
        id,
        show_theme_selector,
        show_settings_button,
        show_ambient_sound_button,
        default_theme,
        default_guide_name,
        default_ambient_track,
        default_ambient_volume,
        default_ambient_enabled,
        default_voice_engine,
        default_gemini_voice,
        default_immersive_voice,
        updated_at
      )
      VALUES (
        'global',
        true,
        true,
        true,
        'gold',
        'Izaque',
        '432hz',
        0.20,
        false,
        'gemini',
        'Charon',
        false,
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        default_theme = 'gold'
      WHERE public.izaque_system_settings.id = 'global';
    `);

    // Habilita RLS e leitura pública para qualquer usuário carregar as diretrizes da sessão
    await client.query(`
      ALTER TABLE public.izaque_system_settings ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Public can view system settings" ON public.izaque_system_settings;
      CREATE POLICY "Public can view system settings"
        ON public.izaque_system_settings FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS "Only superadmin can update system settings" ON public.izaque_system_settings;
      CREATE POLICY "Only superadmin can update system settings"
        ON public.izaque_system_settings FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.izaque_profiles
            WHERE id = auth.uid() AND role = 'master'
          )
        );

      DROP POLICY IF EXISTS "Only superadmin can insert system settings" ON public.izaque_system_settings;
      CREATE POLICY "Only superadmin can insert system settings"
        ON public.izaque_system_settings FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.izaque_profiles
            WHERE id = auth.uid() AND role = 'master'
          )
        );
    `);

    console.log('✅ Migração concluída com sucesso! Tabela public.izaque_system_settings pronta.');
  } catch (error) {
    console.error('❌ Erro na migração de Parâmetros Avançados:', error);
  } finally {
    await client.end();
  }
}

runMigration();
