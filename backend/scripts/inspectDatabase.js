import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  await client.connect();

  const tables = await client.query(`
    select table_name 
    from information_schema.tables 
    where table_schema = 'public' and table_name like 'izaque_%'
    order by table_name;
  `);

  const ext = await client.query(`
    select extname, extversion 
    from pg_extension 
    where extname in ('vector', 'pgcrypto');
  `);

  const rpc = await client.query(`
    select routine_name 
    from information_schema.routines 
    where routine_schema = 'public' and routine_name like '%match_memories%';
  `);

  const profiles = await client.query(`
    select full_name, email, role 
    from public.izaque_profiles;
  `);

  const agents = await client.query(`
    select name, slug, temperature 
    from public.izaque_agents;
  `);

  const memoriesCount = await client.query(`
    select count(*) as total, category 
    from public.izaque_user_memories 
    group by category;
  `);

  console.log(JSON.stringify({
    extensoes: ext.rows,
    tabelas_criadas: tables.rows.map(r => r.table_name),
    funcoes_rpc: rpc.rows.map(r => r.routine_name),
    perfis_usuarios: profiles.rows,
    agentes_mentores: agents.rows,
    total_memorias_por_categoria: memoriesCount.rows
  }, null, 2));

  await client.end();
}

inspect();
