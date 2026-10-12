import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || '10207597Rdv*';
const projectRef = 'ohjuqcrpakswvnoqobiq';

const connectionAttempts = [
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
];

async function runMigration() {
  console.log('🔄 [DB Migration] Adicionando guided_conversation_id a izaque_chat_sessions...');

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
    await client.query(`
      ALTER TABLE public.izaque_chat_sessions 
      ADD COLUMN IF NOT EXISTS guided_conversation_id UUID REFERENCES public.izaque_guided_conversations(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_izaque_chat_sessions_guided_id 
      ON public.izaque_chat_sessions(guided_conversation_id);
    `);
    console.log('✅ Coluna guided_conversation_id e índice adicionados com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
