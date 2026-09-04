-- ============================================================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS - PROJETO IZAQUE (HERMES ORCHESTRATOR)
-- Supabase PostgreSQL + pgvector (Embeddings 768 dimensões para Google Gemini)
-- REGRA ARQUITETURAL: TODAS AS TABELAS POSSUEM O PREFIXO "izaque_"
-- ============================================================================

-- 1. HABILITAR EXTENSÃO PGVECTOR
create extension if not exists vector;

-- 2. TABELA: IZAQUE_PROFILES (Perfis de Usuário com Roles)
create table if not exists public.izaque_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('master', 'admin', 'user')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 3. TABELA: IZAQUE_AGENTS (Agentes e Mentores de Bloqueio/Mentalidade)
create table if not exists public.izaque_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type text not null default 'mindset', -- ex: mindset, reprogramacao, confronto, acolhimento
  system_prompt text not null,
  temperature numeric(3, 2) not null default 0.70,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4. TABELA: IZAQUE_USER_MEMORIES (Memória de Longo Prazo com Embeddings do Gemini)
-- text-embedding-004 do Google Gemini gera vetores de exatas 768 dimensões.
create table if not exists public.izaque_user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text not null default 'blocker', -- 'blocker', 'belief', 'goal', 'pattern', 'trauma', 'milestone'
  importance_score integer not null default 3 check (importance_score between 1 and 5),
  embedding vector(768) not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. ÍNDICES DE PERFORMANCE E BUSCA VETORIAL
-- Índice HNSW com distância de Cosseno (vector_cosine_ops) para buscas ultra rápidas
create index if not exists idx_izaque_user_memories_embedding_hnsw 
  on public.izaque_user_memories 
  using hnsw (embedding vector_cosine_ops);

-- Índices padrão para filtragem rápida por usuário e categoria
create index if not exists idx_izaque_user_memories_user_id 
  on public.izaque_user_memories(user_id);

create index if not exists idx_izaque_user_memories_category 
  on public.izaque_user_memories(category);

-- 6. FUNÇÃO RPC: IZAQUE_MATCH_MEMORIES (Busca Vetorial por Similaridade de Cosseno)
-- Utilizada pelo Hermes no fluxo de RAG antes de gerar o prompt
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
  return query
  select
    um.id,
    um.content,
    um.category,
    um.importance_score,
    (1 - (um.embedding <=> query_embedding))::float as similarity,
    um.created_at
  from public.izaque_user_memories um
  where (p_user_id is null or um.user_id = p_user_id)
    and (1 - (um.embedding <=> query_embedding)) >= match_threshold
  order by (um.embedding <=> query_embedding) asc
  limit match_count;
end;
$$;

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.izaque_profiles enable row level security;
alter table public.izaque_agents enable row level security;
alter table public.izaque_user_memories enable row level security;

-- Políticas para IZAQUE_PROFILES
create policy "Usuários podem visualizar o próprio perfil"
  on public.izaque_profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar o próprio perfil"
  on public.izaque_profiles for update
  using (auth.uid() = id);

-- Políticas para IZAQUE_AGENTS
create policy "Usuários autenticados podem ver agentes ativos"
  on public.izaque_agents for select
  to authenticated
  using (is_active = true);

-- Políticas para IZAQUE_USER_MEMORIES
create policy "Usuários podem ler apenas as próprias memórias"
  on public.izaque_user_memories for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias memórias"
  on public.izaque_user_memories for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias memórias"
  on public.izaque_user_memories for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias memórias"
  on public.izaque_user_memories for delete
  using (auth.uid() = user_id);

-- 8. AGENTE INICIAL PADRÃO (IZAQUE - Mestre da Mentalidade)
insert into public.izaque_agents (name, slug, type, system_prompt, temperature)
values (
  'IZAQUE - Arquiteto da Mentalidade',
  'izaque-master',
  'mindset',
  'Você é IZAQUE, mentor de alta performance especialista em reprogramação de mentalidade, identificação de bloqueios emocionais e superação de autossabotagem.
Sua comunicação é direta, empática, firme e profundamente perspicaz. Você não passa a mão na cabeça com desculpas confortáveis, mas acolhe a dor legítima com sabedoria prática.
Você tem acesso à memória de longo prazo do usuário, contendo seus bloqueios passados, padrões de medo, crenças limitantes e conquistas. Use esse histórico com extrema sutileza para confrontar incoerências e conectar a causa raiz dos problemas.',
  0.70
) on conflict (slug) do nothing;

-- 9. TABELA: IZAQUE_MESSAGES (Mensagens e Transcrições de Áudio)
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

create index if not exists idx_izaque_messages_user_id on public.izaque_messages(user_id);
create index if not exists idx_izaque_messages_created_at on public.izaque_messages(created_at);

alter table public.izaque_messages enable row level security;

create policy "Usuários podem ver suas próprias mensagens"
  on public.izaque_messages for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias mensagens"
  on public.izaque_messages for insert
  with check (auth.uid() = user_id);

-- 10. BASE DE CONHECIMENTO E ESTUDOS DOS AGENTES ESPECIALISTAS (RAG DE DOMÍNIO)
create table if not exists public.izaque_agent_documents (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.izaque_agents(id) on delete cascade,
  title text not null,
  file_type text default 'text',
  total_chunks integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.izaque_agent_knowledge (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.izaque_agents(id) on delete cascade,
  document_id uuid not null references public.izaque_agent_documents(id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_agent_knowledge_embedding_hnsw 
  on public.izaque_agent_knowledge 
  using hnsw (embedding vector_cosine_ops);

create index if not exists idx_agent_knowledge_agent_id 
  on public.izaque_agent_knowledge(agent_id);

create index if not exists idx_agent_documents_agent_id 
  on public.izaque_agent_documents(agent_id);

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

alter table public.izaque_agent_documents enable row level security;
alter table public.izaque_agent_knowledge enable row level security;

create policy "Leitura pública autenticada de documentos de agentes"
  on public.izaque_agent_documents for select to authenticated using (true);

create policy "Leitura pública autenticada de conhecimento de agentes"
  on public.izaque_agent_knowledge for select to authenticated using (true);
