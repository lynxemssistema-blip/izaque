import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Conectado ao Supabase PostgreSQL');

  // 1. Adiciona avatar_url e phone na tabela izaque_profiles
  await client.query(`
    alter table public.izaque_profiles 
    add column if not exists avatar_url text;
  `);

  await client.query(`
    alter table public.izaque_profiles 
    add column if not exists phone text;
  `);
  console.log('✅ Colunas avatar_url e phone adicionadas em izaque_profiles');

  // 2. Garante isolamento ESTRITO por usuário na busca vetorial de memórias
  await client.query(`
    create or replace function public.izaque_match_memories (
      query_embedding vector(768),
      match_threshold float default 0.45,
      match_count int default 5,
      p_user_id uuid default null
    )
    returns table (
      id uuid,
      content text,
      category text,
      importance_score int,
      similarity float,
      created_at timestamptz
    )
    language plpgsql
    security definer
    as $$
    begin
      -- Regra de Segurança e Isolamento: Se não houver p_user_id válido, retorna lista vazia!
      -- Jamais vazar memórias de outros usuários sob nenhuma hipótese.
      if p_user_id is null then
        return;
      end if;

      return query
      select
        um.id,
        um.content,
        um.category,
        um.importance_score,
        (1 - (um.embedding <=> query_embedding))::float as similarity,
        um.created_at
      from public.izaque_user_memories um
      where um.user_id = p_user_id
        and (1 - (um.embedding <=> query_embedding)) >= match_threshold
      order by (um.embedding <=> query_embedding) asc
      limit match_count;
    end;
    $$;
  `);
  console.log('✅ RPC izaque_match_memories atualizada com isolamento estrito!');

  // 3. Verifica colunas atuais
  const res = await client.query(`
    select column_name, data_type 
    from information_schema.columns 
    where table_name = 'izaque_profiles';
  `);
  console.log('📋 Colunas de izaque_profiles:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
}

main().catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
