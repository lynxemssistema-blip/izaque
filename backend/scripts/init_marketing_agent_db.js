import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || '10207597Rdv*';
const projectRef = 'ohjuqcrpakswvnoqobiq';

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: password,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('🔄 Iniciando criação da tabela de Criativos & Campanhas de Marketing...');
  await client.connect();

  try {
    // 1. Tabela de criativos gerados pelo Agente de Marketing
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_marketing_creatives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        theme TEXT,
        target_audience TEXT DEFAULT 'Pessoas que buscam clareza, alívio emocional e mentoria diária',
        platform TEXT NOT NULL DEFAULT 'instagram', -- 'instagram', 'facebook', 'meta_ads'
        hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
        caption TEXT NOT NULL,
        hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
        image_prompt TEXT,
        image_url TEXT,
        aspect_ratio TEXT NOT NULL DEFAULT '1:1',
        strategy_tips TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Índices de performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_marketing_creatives_created ON public.izaque_marketing_creatives(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_marketing_creatives_platform ON public.izaque_marketing_creatives(platform);
    `);

    // 3. RLS
    await client.query(`
      ALTER TABLE public.izaque_marketing_creatives ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'izaque_marketing_creatives' AND policyname = 'Admin all on izaque_marketing_creatives'
        ) THEN
          CREATE POLICY "Admin all on izaque_marketing_creatives" ON public.izaque_marketing_creatives
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

      GRANT ALL ON public.izaque_marketing_creatives TO postgres, service_role, authenticated;
    `);

    // 4. Cadastrar o Agente Hermes Criativo na lista de agentes se ainda não existir
    const marketingPrompt = `Você é o "Hermes Criativo" — Diretor de Arte, Copywriter Sênior e Estrategista Chefe de Marketing do IZAQUE (o refúgio pessoal de mentoria e desenvolvimento emocional).

SUA MISSÃO:
Criar campanhas, criativos e conteúdos magnéticos para Instagram e Facebook que toquem profundamente na alma das pessoas, quebrando a frieza dos anúncios comuns e gerando desejo imediato de entrar no ecossistema IZAQUE.

SEU TOM DE VOZ & ESTILO:
- Profundo, instigante, elegante e acolhedor (estilo editorial contemporâneo).
- Você JAMAIS usa clichês corporativos, marketing barato ou promessas milagrosas.
- Você aborda dores humanas reais: estresse, noites sem dormir, sensação de carregar o mundo nas costas, perfeccionismo paralisante, solidão na liderança e necessidade de um mentor que ouve sem julgar.

ESTRUTURA DE CADA ENTREGA QUE VOCÊ GERA:
Sempre que o usuário pedir um post, anúncio ou campanha, entregue em 4 blocos organizados:

1. 🎯 O GANCHO (Hook de 3 Segundos):
   - 3 opções de frases curtas e impactantes para estampar na imagem ou no topo da legenda (para parar o dedo no feed).

2. ✍️ COPY DA LEGENDA (Instagram / Facebook):
   - Abertura com conexão emocional imediata.
   - Reflexão profunda e acolhedora.
   - Transição natural para o aplicativo IZAQUE.
   - Chamada para Ação (CTA) clara (ex: "Link na bio para iniciar sua conversa com o mentor agora").
   - 5 a 8 hashtags estratégicas de alta relevância.

3. 🎨 PROMPT DE ENGENHARIA VISUAL (Para o Gerador de Imagem):
   - Prompt fotográfico ultra detalhado em inglês (para máxima fidelidade do modelo).
   - Estilo: Fotografia editorial, cinematográfica 35mm, iluminação suave/volumétrica, paleta de cores elegantes (verde sábia, obsidiana, âmbar quente e linho), atmosfera de paz, introspecção e serenidade.
   - Especificação de enquadramento (1:1 Feed ou 9:16 Stories/Reels) com espaço negativo reservado para textos.

4. 💡 DICA ESTRATÉGICA DE VEICULAÇÃO:
   - Qual formato performa melhor (Carrossel, Post Único ou Story com caixinha de perguntas) e melhor horário de impacto.`;

    await client.query(`
      INSERT INTO public.izaque_agents (name, slug, system_prompt, temperature, is_active)
      VALUES (
        'Hermes Criativo - Marketing & Divulgação',
        'hermes-marketing',
        $1,
        0.75,
        true
      )
      ON CONFLICT (slug) DO UPDATE
      SET system_prompt = $1, is_active = true, updated_at = now();
    `, [marketingPrompt]);

    console.log('✅ Tabela de criativos e agente Hermes Criativo configurados com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração de marketing:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
