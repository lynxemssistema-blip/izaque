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
    console.log('✅ Conectado ao Supabase PostgreSQL');

    // 1. Adiciona coluna preferences (JSONB)
    await client.query(`
      alter table public.izaque_profiles 
      add column if not exists preferences jsonb default '{}'::jsonb;
    `);
    console.log('✅ Coluna preferences (JSONB) adicionada com sucesso em public.izaque_profiles');

    // 2. Verifica a estrutura da tabela
    const res = await client.query(`
      select column_name, data_type 
      from information_schema.columns 
      where table_name = 'izaque_profiles'
      order by ordinal_position;
    `);

    console.log('📋 Colunas atualizadas em izaque_profiles:');
    res.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type}`));

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao adicionar coluna preferences:', err);
    await client.end();
    process.exit(1);
  }
}

run();
