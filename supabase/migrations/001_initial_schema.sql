-- ============================================================
-- ACERVO VIVO — Schema inicial
-- Rodar no Supabase: SQL Editor → New Query → colar e executar
-- ============================================================

-- ── Perfis (estende auth.users) ─────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  cpf         text unique not null,
  nome        text not null,
  email       text,
  telefone    text,
  perfil      text not null default 'leitor' check (perfil in ('leitor', 'administrador')),
  foto        text,
  ativo       boolean not null default true,
  pending_senha boolean not null default false,
  token_senha text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê seu próprio perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on public.profiles for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.perfil = 'administrador')
  );

create policy "Usuário atualiza seu próprio perfil"
  on public.profiles for update using (auth.uid() = id);

create policy "Admin gerencia todos os perfis"
  on public.profiles for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.perfil = 'administrador')
  );

-- trigger para criar perfil automaticamente ao criar usuário no auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, cpf, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'cpf', new.email),
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'leitor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Livros do acervo ────────────────────────────────────────
create table if not exists public.livros (
  id          uuid primary key default gen_random_uuid(),
  tombo       text,
  isbn        text,
  titulo      text not null,
  autor       text,
  ano         text,
  edicao      text,
  editora     text,
  local       text,
  paginas     integer,
  generos     text[] default '{}',
  conservacao text,
  foto        text,
  nota        numeric(3,1) default 0,
  comentario  text default '',
  status      text not null default 'Disponível' check (status in ('Disponível', 'Emprestado')),
  historico   jsonb default '[]',
  created_at  timestamptz default now()
);

alter table public.livros enable row level security;

create policy "Autenticados veem o acervo"
  on public.livros for select using (auth.role() = 'authenticated');

create policy "Autenticados gerenciam o acervo"
  on public.livros for all using (auth.role() = 'authenticated');

-- ── Empréstimos ─────────────────────────────────────────────
create table if not exists public.emprestimos (
  id                     uuid primary key default gen_random_uuid(),
  livro_id               uuid references public.livros on delete set null,
  locatario              text not null,
  data_emprestimo        date not null,
  data_devolucao         date not null,
  data_devolvido         timestamptz,
  devolvido_por          text,
  data_devolucao_efetiva date,
  status                 text not null default 'Ativo' check (status in ('Ativo', 'Atrasado', 'Devolvido')),
  observacoes            text default '',
  renovacao              jsonb,
  created_at             timestamptz default now()
);

alter table public.emprestimos enable row level security;

create policy "Autenticados gerenciam empréstimos"
  on public.emprestimos for all using (auth.role() = 'authenticated');

-- ── Renovações ──────────────────────────────────────────────
create table if not exists public.renovacoes (
  id                uuid primary key default gen_random_uuid(),
  emprestimo_id     uuid references public.emprestimos on delete set null,
  livro_id          uuid references public.livros on delete set null,
  locatario         text not null,
  status            text not null default 'Solicitada' check (status in ('Solicitada', 'Aprovada', 'Negada')),
  justificativa     text,
  nova_data         date,
  observacao_admin  text,
  data_solicitacao  timestamptz default now(),
  created_at        timestamptz default now()
);

alter table public.renovacoes enable row level security;

create policy "Autenticados gerenciam renovações"
  on public.renovacoes for all using (auth.role() = 'authenticated');

-- ── Log de notificações ─────────────────────────────────────
create table if not exists public.notificacoes_log (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null,
  destinatario    text not null,
  texto           text not null,
  canal           text default 'WhatsApp Business',
  twilio_sid      text,
  status_entrega  text default 'enviado',
  created_at      timestamptz default now()
);

alter table public.notificacoes_log enable row level security;

create policy "Admin gerencia log de notificações"
  on public.notificacoes_log for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.perfil = 'administrador')
  );

-- ── Configuração de notificações (singleton) ────────────────
create table if not exists public.config_notif (
  id                integer primary key default 1 check (id = 1),
  ativo             boolean default true,
  antecedencia_dias integer default 2,
  horario_envio     time default '08:00',
  updated_at        timestamptz default now()
);

insert into public.config_notif (id) values (1) on conflict do nothing;

alter table public.config_notif enable row level security;

create policy "Autenticados veem config"
  on public.config_notif for select using (auth.role() = 'authenticated');

create policy "Admin atualiza config"
  on public.config_notif for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.perfil = 'administrador')
  );

-- ── Leituras ────────────────────────────────────────────────
create table if not exists public.leituras (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  livro_id   uuid references public.livros on delete cascade not null,
  progresso  integer default 0 check (progresso >= 0 and progresso <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, livro_id)
);

alter table public.leituras enable row level security;

create policy "Usuário gerencia suas leituras"
  on public.leituras for all using (auth.uid() = user_id);

-- ── Anotações ───────────────────────────────────────────────
create table if not exists public.anotacoes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  livro_id   uuid references public.livros on delete set null,
  titulo     text,
  texto      text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anotacoes enable row level security;

create policy "Usuário gerencia suas anotações"
  on public.anotacoes for all using (auth.uid() = user_id);

-- ── Lista de desejos ────────────────────────────────────────
create table if not exists public.desejos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  titulo     text not null,
  autor      text,
  isbn       text,
  capa_url   text,
  fonte      text check (fonte in ('google_books', 'manual')),
  livro_id   uuid references public.livros on delete set null,
  created_at timestamptz default now()
);

alter table public.desejos enable row level security;

create policy "Usuário gerencia sua lista de desejos"
  on public.desejos for all using (auth.uid() = user_id);

-- ── Comunidade: Grupos ──────────────────────────────────────
create table if not exists public.grupos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  descricao  text,
  membros    text[] default '{}',
  created_at timestamptz default now()
);

alter table public.grupos enable row level security;

create policy "Autenticados gerenciam grupos"
  on public.grupos for all using (auth.role() = 'authenticated');

-- ── Comunidade: Posts ───────────────────────────────────────
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  grupo_id   uuid references public.grupos on delete cascade,
  autor      text not null,
  texto      text not null,
  likes      text[] default '{}',
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Autenticados gerenciam posts"
  on public.posts for all using (auth.role() = 'authenticated');

-- ── Minha Biblioteca — Livros pessoais ──────────────────────
create table if not exists public.minha_biblioteca_livros (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  titulo      text not null,
  autor       text,
  isbn        text,
  ano         text,
  editora     text,
  conservacao text,
  foto        text,
  status      text default 'Disponível' check (status in ('Disponível', 'Emprestado')),
  created_at  timestamptz default now()
);

alter table public.minha_biblioteca_livros enable row level security;

create policy "Usuário gerencia sua biblioteca pessoal"
  on public.minha_biblioteca_livros for all using (auth.uid() = user_id);

-- ── Minha Biblioteca — Empréstimos pessoais ─────────────────
create table if not exists public.minha_biblioteca_emprestimos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  livro_id        uuid references public.minha_biblioteca_livros on delete set null,
  amigo           text not null,
  data_emprestimo date not null,
  data_devolucao  date not null,
  data_devolvido  date,
  status          text default 'Ativo' check (status in ('Ativo', 'Atrasado', 'Devolvido')),
  observacoes     text,
  created_at      timestamptz default now()
);

alter table public.minha_biblioteca_emprestimos enable row level security;

create policy "Usuário gerencia seus empréstimos pessoais"
  on public.minha_biblioteca_emprestimos for all using (auth.uid() = user_id);
