import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL do Supabase');

    // 1. Atualiza nome do plano anual para remover 'Santuário'
    console.log('⏳ 1. Removendo palavra Santuário dos planos...');
    await client.query(`
      UPDATE public.izaque_plans
      SET name = 'Mentoria Plena (Anual)'
      WHERE id = 'pro_annual';
    `);

    // 2. Cria tabela public.izaque_creator
    console.log('⏳ 2. Criando tabela public.izaque_creator...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_creator (
        id TEXT PRIMARY KEY DEFAULT 'main',
        name TEXT NOT NULL DEFAULT 'Edson Manoel',
        title TEXT DEFAULT 'Idealizador & Criador do IZAQUE',
        bio TEXT,
        story TEXT,
        quote TEXT,
        image_url TEXT,
        social_instagram TEXT,
        social_linkedin TEXT,
        social_whatsapp TEXT,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Habilitar RLS e criar políticas
    await client.query(`
      ALTER TABLE public.izaque_creator ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Leitura pública do idealizador" ON public.izaque_creator;
      CREATE POLICY "Leitura pública do idealizador"
        ON public.izaque_creator
        FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS "Acesso total service_role idealizador" ON public.izaque_creator;
      CREATE POLICY "Acesso total service_role idealizador"
        ON public.izaque_creator
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    `);

    // Inserir registro padrão se não existir
    console.log('⏳ 3. Inserindo ou atualizando perfil do Idealizador...');
    await client.query(`
      INSERT INTO public.izaque_creator (
        id,
        name,
        title,
        bio,
        story,
        quote,
        image_url,
        is_visible
      ) VALUES (
        'main',
        'Edson Manoel',
        'Idealizador & Criador do IZAQUE',
        'Empreendedor, mentor de clareza e apaixonado pelo potencial humano. Concebeu o Izaque após anos observando como o excesso de ruído diário, a autocobrança desmedida e a solidão nas decisões travam vidas brilhantes.',
        'O Izaque nasceu de um propósito genuíno: construir um espaço onde as pessoas não precisem carregar armaduras ou provar nada. Um ambiente com escuta atenta, sem julgamentos e com perguntas certas para desembaraçar a mente e devolver a direção.',
        '\"O verdadeiro crescimento não começa quando você tenta ser perfeito, mas quando tem a coragem de desacelerar e ser honesto consigo mesmo.\"',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
        true
      ) ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Migração do Idealizador concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
  } finally {
    await client.end();
  }
}

run();
