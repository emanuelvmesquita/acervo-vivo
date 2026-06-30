-- ============================================================
-- ACERVO VIVO — Refactor Título/Exemplar
-- Separa a obra bibliográfica (titulos) da cópia física (exemplares).
-- Rodar no Supabase: SQL Editor → New Query → colar e executar (arquivo inteiro)
-- ============================================================

-- ── Títulos (obra bibliográfica) ─────────────────────────────
-- Reaproveita o id de cada linha de "livros" como id do título correspondente,
-- assim FKs antigas que apontavam para livros.id (ex: emprestimos.livro_id)
-- continuam resolvendo para o título certo durante a migração.
create table if not exists public.titulos (
  id          uuid primary key default gen_random_uuid(),
  isbn        text,
  titulo      text not null,
  autor       text,
  ano         text,
  edicao      text,
  editora     text,
  paginas     integer,
  generos     text[] default '{}',
  foto        text,
  nota        numeric(3,1) default 0,
  comentario  text default '',
  created_at  timestamptz default now()
);

alter table public.titulos enable row level security;

create policy "Autenticados veem o acervo"
  on public.titulos for select using (auth.role() = 'authenticated');

create policy "Autenticados gerenciam o acervo"
  on public.titulos for all using (auth.role() = 'authenticated');

-- ── Exemplares (cópia física de um título) ───────────────────
create table if not exists public.exemplares (
  id                 uuid primary key default gen_random_uuid(),
  titulo_id          uuid references public.titulos on delete cascade not null,
  tombo              text,
  local              text,
  conservacao        text,
  status             text not null default 'Disponível' check (status in ('Disponível', 'Emprestado', 'Indisponível')),
  motivo_indisponivel text,
  historico          jsonb default '[]',
  created_at         timestamptz default now()
);

alter table public.exemplares enable row level security;

create policy "Autenticados veem os exemplares"
  on public.exemplares for select using (auth.role() = 'authenticated');

create policy "Autenticados gerenciam os exemplares"
  on public.exemplares for all using (auth.role() = 'authenticated');

-- ── Migração de dados: 1 livro → 1 título + 1 exemplar ───────
insert into public.titulos (id, isbn, titulo, autor, ano, edicao, editora, paginas, generos, foto, nota, comentario, created_at)
select id, isbn, titulo, autor, ano, edicao, editora, paginas, generos, foto, nota, comentario, created_at
from public.livros;

insert into public.exemplares (titulo_id, tombo, local, conservacao, status, historico, created_at)
select id, tombo, local, conservacao, status, historico, created_at
from public.livros;

-- ── Empréstimos: trocar livro_id por exemplar_id + vincular usuário ──
alter table public.emprestimos add column exemplar_id uuid references public.exemplares on delete set null;

update public.emprestimos e
set exemplar_id = (select x.id from public.exemplares x where x.titulo_id = e.livro_id limit 1)
where e.livro_id is not null;

alter table public.emprestimos drop column livro_id;
alter table public.emprestimos add column usuario_id uuid references public.profiles on delete set null;

-- ── Renovações: troca livro_id por referência ao título (apenas leitura/exibição) ──
alter table public.renovacoes add column titulo_id uuid references public.titulos on delete set null;
update public.renovacoes set titulo_id = livro_id where livro_id is not null;
alter table public.renovacoes drop column livro_id;

-- ── Leituras, anotações e desejos: livro_id → titulo_id (são sobre a obra, não a cópia) ──
alter table public.leituras rename column livro_id to titulo_id;
alter table public.leituras drop constraint if exists leituras_livro_id_fkey;
alter table public.leituras add constraint leituras_titulo_id_fkey foreign key (titulo_id) references public.titulos on delete cascade;

alter table public.anotacoes rename column livro_id to titulo_id;
alter table public.anotacoes drop constraint if exists anotacoes_livro_id_fkey;
alter table public.anotacoes add constraint anotacoes_titulo_id_fkey foreign key (titulo_id) references public.titulos on delete set null;

alter table public.desejos rename column livro_id to titulo_id;
alter table public.desejos drop constraint if exists desejos_livro_id_fkey;
alter table public.desejos add constraint desejos_titulo_id_fkey foreign key (titulo_id) references public.titulos on delete set null;

-- ── Remove a tabela antiga (substituída por titulos + exemplares) ──
drop table public.livros;
