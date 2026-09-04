import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function createMessagesTable() {
  await client.connect();
  console.log('📡 Conectando ao Supabase para criar tabela de mensagens e transcrições de áudio...');

  const sql = `
    -- Tabela para armazenar histórico de mensagens e transcrições de áudio
    create table if not exists public.izaque_messages (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      agent_id uuid references public.izaque_agents(id) on delete set null,
      role text not null check (role in ('user', 'assistant')),
      content text not null,
      is_audio boolean not null default false,
      audio_duration_seconds numeric(5, 2),
      created_at timestamptz not null default timezone('utc'::text, now())
    );

    -- Índices
    create index if not exists idx_izaque_messages_user_id on public.izaque_messages(user_id);
    create index if not exists idx_izaque_messages_created_at on public.izaque_messages(created_at);

    -- RLS
    alter table public.izaque_messages enable row level security;

    create policy "Usuários podem ver suas próprias mensagens"
      on public.izaque_messages for select
      using (auth.uid() = user_id);

    create policy "Usuários podem inserir suas próprias mensagens"
      on public.izaque_messages for insert
      with check (auth.uid() = user_id);
  `;

  await client.query(sql);
  console.log('✅ Tabela public.izaque_messages criada com sucesso no Supabase!');
  await client.end();
}

createMessagesTable();
