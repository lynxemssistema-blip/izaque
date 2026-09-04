import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.resolve(__dirname, '../../supabase/schema.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

const password = '10207597Rdv*';
const projectRef = 'ohjuqcrpakswvnoqobiq';

// Tentativa de conexões possíveis (Direta e Poolers conhecidos)
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
  console.log('🔄 Iniciando execução automática do schema no Supabase...\n');

  let connectedClient = null;

  for (const attempt of connectionAttempts) {
    console.log(`📡 Tentando: ${attempt.name}...`);
    const client = new pg.Client(attempt.config);
    try {
      await client.connect();
      console.log(`✅ Conexão bem-sucedida via: ${attempt.name}!`);
      connectedClient = client;
      break;
    } catch (err) {
      console.log(`⚠️ Falha ao conectar via ${attempt.name}: ${err.message}`);
      await client.end().catch(() => {});
    }
  }

  if (!connectedClient) {
    console.error('\n❌ Não foi possível conectar diretamente ao PostgreSQL.');
    console.error('Dica: Use o SQL Editor do Supabase ou verifique a região do banco.');
    process.exit(1);
  }

  try {
    console.log('\n🚀 Executando schema SQL (pgvector, tabelas izaque_*, RPC match_memories)...');
    await connectedClient.query(sqlContent);
    console.log('🎉 Schema SQL executado com absoluto sucesso!\n');

    // Validação das tabelas criadas
    console.log('🔍 Validando tabelas no banco de dados:');
    const res = await connectedClient.query(`
      select table_name 
      from information_schema.tables 
      where table_schema = 'public' and table_name like 'izaque_%';
    `);

    console.log('Tabelas encontradas:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));

    // Validação da extensão vector
    const extRes = await connectedClient.query(`
      select extname, extversion from pg_extension where extname = 'vector';
    `);
    if (extRes.rows.length > 0) {
      console.log(`✅ Extensão vector ativa (versão ${extRes.rows[0].extversion})`);
    }

    // Validação do agente padrão
    const agentRes = await connectedClient.query(`
      select name, slug from public.izaque_agents limit 1;
    `);
    if (agentRes.rows.length > 0) {
      console.log(`✅ Agente inicial cadastrado: "${agentRes.rows[0].name}" (${agentRes.rows[0].slug})`);
    }

  } catch (err) {
    console.error('❌ Erro durante a execução do SQL:', err.message);
  } finally {
    await connectedClient.end();
  }
}

runMigration();
