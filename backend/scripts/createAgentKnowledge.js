import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function createAgentKnowledgeSchema() {
  await client.connect();
  console.log('📡 Conectando ao Supabase para criar Base de Conhecimento dos Agentes Especialistas...');

  const sql = `
    -- 1. Tabela de Documentos / Arquivos de Estudo do Agente
    create table if not exists public.izaque_agent_documents (
      id uuid primary key default gen_random_uuid(),
      agent_id uuid not null references public.izaque_agents(id) on delete cascade,
      title text not null,
      file_type text default 'text',
      total_chunks integer not null default 0,
      created_at timestamptz not null default timezone('utc'::text, now())
    );

    -- 2. Tabela de Trechos Vetorizados (Chunks de Conhecimento com pgvector 768d)
    create table if not exists public.izaque_agent_knowledge (
      id uuid primary key default gen_random_uuid(),
      agent_id uuid not null references public.izaque_agents(id) on delete cascade,
      document_id uuid not null references public.izaque_agent_documents(id) on delete cascade,
      content text not null,
      embedding vector(768) not null,
      created_at timestamptz not null default timezone('utc'::text, now())
    );

    -- 3. Índices de Alta Performance (HNSW de Cosseno)
    create index if not exists idx_agent_knowledge_embedding_hnsw 
      on public.izaque_agent_knowledge 
      using hnsw (embedding vector_cosine_ops);

    create index if not exists idx_agent_knowledge_agent_id 
      on public.izaque_agent_knowledge(agent_id);

    create index if not exists idx_agent_documents_agent_id 
      on public.izaque_agent_documents(agent_id);

    -- 4. Função RPC: Busca Semântica na Base de Conhecimento do Agente
    create or replace function public.izaque_match_agent_knowledge (
      query_embedding vector(768),
      p_agent_id uuid,
      match_threshold float default 0.40,
      match_count int default 4
    )
    returns table (
      id uuid,
      document_id uuid,
      content text,
      similarity float
    )
    language plpgsql
    security definer
    as $$
    begin
      return query
      select
        k.id,
        k.document_id,
        k.content,
        (1 - (k.embedding <=> query_embedding))::float as similarity
      from public.izaque_agent_knowledge k
      where k.agent_id = p_agent_id
        and (1 - (k.embedding <=> query_embedding)) >= match_threshold
      order by (k.embedding <=> query_embedding) asc
      limit match_count;
    end;
    $$;

    -- 5. RLS
    alter table public.izaque_agent_documents enable row level security;
    alter table public.izaque_agent_knowledge enable row level security;

    create policy "Leitura pública autenticada de documentos de agentes"
      on public.izaque_agent_documents for select to authenticated using (true);

    create policy "Leitura pública autenticada de conhecimento de agentes"
      on public.izaque_agent_knowledge for select to authenticated using (true);
  `;

  await client.query(sql);
  console.log('✅ Base de Conhecimento e RAG de Agentes criada com sucesso no Supabase!');
  await client.end();
}

createAgentKnowledgeSchema();
