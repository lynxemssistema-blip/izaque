import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  const u = await client.query("SELECT id, email, created_at FROM auth.users WHERE email ILIKE '%thiago%'");
  console.log('auth.users:', u.rows);
  const p = await client.query("SELECT id, email, full_name, role FROM public.izaque_profiles WHERE email ILIKE '%thiago%'");
  console.log('izaque_profiles:', p.rows);
  const m = await client.query("SELECT id, email, name, role_title FROM public.izaque_project_members WHERE email ILIKE '%thiago%'");
  console.log('izaque_project_members:', m.rows);
  await client.end();
}

check().catch(console.error);
