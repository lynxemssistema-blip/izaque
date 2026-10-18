import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

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
  console.log('🔄 [Incômodo Criativo DB] Iniciando migração das tabelas para o Laboratório do Incômodo Criativo...');

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
    console.log('⏳ Criando tabela public.izaque_creative_troubles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_creative_troubles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Novo Incômodo Criativo',
        
        -- Seção 1: Descrição do Incômodo (Fato vs Interpretação)
        fact_description TEXT NOT NULL,
        
        -- Seção 2: Auto percepções
        posture_level INTEGER NOT NULL DEFAULT 1 CHECK (posture_level BETWEEN 1 AND 10),
        trouble_type TEXT NOT NULL DEFAULT 'mental', -- 'mental', 'comportamento', 'relacionamento', 'acontecimento', 'nao_sei'
        cause_aspects TEXT,
        effect_aspects TEXT,
        internal_state TEXT NOT NULL DEFAULT 'coragem',
        
        -- Seção 3: Conexões
        context TEXT NOT NULL DEFAULT 'pessoal', -- 'pessoal', 'profissional', 'social'
        parties_involved JSONB NOT NULL DEFAULT '[]'::jsonb,
        
        -- Seção 4: Matriz de Impacto (IRRI)
        intensity_score INTEGER NOT NULL DEFAULT 3 CHECK (intensity_score BETWEEN 1 AND 5),
        intensity_notes TEXT,
        relevance_score INTEGER NOT NULL DEFAULT 3 CHECK (relevance_score BETWEEN 1 AND 5),
        relevance_notes TEXT,
        responsibility_score INTEGER NOT NULL DEFAULT 3 CHECK (responsibility_score BETWEEN 1 AND 5),
        responsibility_notes TEXT,
        influence_score INTEGER NOT NULL DEFAULT 3 CHECK (influence_score BETWEEN 1 AND 5),
        influence_notes TEXT,
        
        -- Seção 5: Síntese e Desabafo
        attention_reason TEXT,
        additional_notes TEXT,
        
        -- Diagnóstico e Orquestração da IA (Izaque / Thiago Prata)
        ai_diagnosis JSONB, -- { summary: string, quadrant: string, keyAdvice: string, recommendedNextPosture: number, hawkinsShift: string }
        micro_action_24h TEXT,
        
        -- Ciclo de vida
        status TEXT NOT NULL DEFAULT 'ativo', -- 'rascunho', 'ativo', 'em_experimentacao', 'superado'
        
        -- Área restrita do Super Admin / Profissional Mentor
        mentor_notes TEXT,
        reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log('⏳ Criando índices para performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_izaque_creative_troubles_user_id 
        ON public.izaque_creative_troubles(user_id);

      CREATE INDEX IF NOT EXISTS idx_izaque_creative_troubles_created_at 
        ON public.izaque_creative_troubles(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_izaque_creative_troubles_status 
        ON public.izaque_creative_troubles(status);
    `);

    console.log('⏳ Configurando políticas de Row Level Security (RLS)...');
    await client.query(`
      ALTER TABLE public.izaque_creative_troubles ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can manage their own creative troubles" ON public.izaque_creative_troubles;
      CREATE POLICY "Users can manage their own creative troubles"
        ON public.izaque_creative_troubles
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Admins can view and edit all creative troubles" ON public.izaque_creative_troubles;
      CREATE POLICY "Admins can view and edit all creative troubles"
        ON public.izaque_creative_troubles
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.izaque_profiles
            WHERE id = auth.uid() AND role IN ('master', 'admin')
          )
        );
    `);

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
  }
}

runMigration();
