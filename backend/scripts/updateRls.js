import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function applyPolicies() {
  await client.connect();
  console.log('Connected to Supabase DB!');

  const sql = `
    -- Política de leitura de agentes para todos os autenticados
    drop policy if exists "Usuários autenticados podem ver agentes ativos" on public.izaque_agents;
    create policy "Usuários autenticados podem ver agentes ativos"
      on public.izaque_agents for select
      to authenticated
      using (true);

    -- Permitir leitura pública/anônima de agentes ativos para a interface carregar mesmo sem login
    drop policy if exists "Leitura anônima de agentes ativos" on public.izaque_agents;
    create policy "Leitura anônima de agentes ativos"
      on public.izaque_agents for select
      to anon
      using (is_active = true);

    -- Permitir admins visualizarem todos os perfis
    drop policy if exists "Admins podem visualizar todos os perfis" on public.izaque_profiles;
    create policy "Admins podem visualizar todos os perfis"
      on public.izaque_profiles for select
      using (
        auth.uid() = id or (auth.jwt() ->> 'email' = 'edsonmanoel2012@gmail.com')
      );

    -- Permitir admins visualizarem todas as memórias
    drop policy if exists "Admins podem visualizar todas as memórias" on public.izaque_user_memories;
    create policy "Admins podem visualizar todas as memórias"
      on public.izaque_user_memories for select
      using (
        auth.uid() = user_id or (auth.jwt() ->> 'email' = 'edsonmanoel2012@gmail.com')
      );

    -- Garantir que usuários possam ler suas mensagens
    drop policy if exists "Usuários podem ver suas próprias mensagens" on public.izaque_messages;
    create policy "Usuários podem ver suas próprias mensagens"
      on public.izaque_messages for select
      using (
        auth.uid() = user_id or (auth.jwt() ->> 'email' = 'edsonmanoel2012@gmail.com')
      );
  `;

  await client.query(sql);
  console.log('✅ Políticas de RLS atualizadas com sucesso para acesso direto do cliente ao banco de dados!');
  await client.end();
}

applyPolicies().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
