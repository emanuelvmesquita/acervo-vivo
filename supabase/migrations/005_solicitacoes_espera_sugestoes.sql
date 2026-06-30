-- ============================================================
-- ACERVO VIVO — Solicitações de empréstimo, lista de espera e sugestões
-- Rodar no Supabase: SQL Editor → New Query → colar e executar (arquivo inteiro)
-- Pré-requisito: 004_titulo_exemplar.sql já aplicada.
-- ============================================================

-- ── Solicitações de empréstimo (leitor pede, admin confirma/recusa) ──
create table if not exists public.solicitacoes_emprestimo (
  id                  uuid primary key default gen_random_uuid(),
  titulo_id           uuid references public.titulos on delete cascade not null,
  usuario_id          uuid references public.profiles on delete cascade not null,
  data_desejada       date,
  status              text not null default 'Pendente' check (status in ('Pendente', 'Confirmada', 'Recusada', 'Cancelada')),
  justificativa_recusa text,
  exemplar_id         uuid references public.exemplares on delete set null,
  data_solicitacao    timestamptz default now(),
  created_at          timestamptz default now()
);

alter table public.solicitacoes_emprestimo enable row level security;

create policy "Usuário gerencia suas solicitações"
  on public.solicitacoes_emprestimo for all using (auth.uid() = usuario_id);

create policy "Admin gerencia todas as solicitações"
  on public.solicitacoes_emprestimo for all using (public.is_admin());

-- ── Lista de espera por título ────────────────────────────────
create table if not exists public.lista_espera (
  id          uuid primary key default gen_random_uuid(),
  titulo_id   uuid references public.titulos on delete cascade not null,
  usuario_id  uuid references public.profiles on delete cascade not null,
  created_at  timestamptz default now(),
  unique (titulo_id, usuario_id)
);

alter table public.lista_espera enable row level security;

create policy "Usuário gerencia sua entrada na lista de espera"
  on public.lista_espera for all using (auth.uid() = usuario_id);

create policy "Admin vê toda a lista de espera"
  on public.lista_espera for select using (public.is_admin());

-- ── Sugestões da comunidade (backlog) ─────────────────────────
create table if not exists public.sugestoes (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references public.profiles on delete cascade not null,
  titulo          text not null,
  descricao       text,
  prioridade      text check (prioridade in ('Alta', 'Média', 'Baixa')),
  status_sugestao text not null default 'Em análise' check (status_sugestao in ('Em análise', 'Planejado', 'Em desenvolvimento', 'Concluído', 'Recusado')),
  created_at      timestamptz default now()
);

alter table public.sugestoes enable row level security;

create policy "Autenticados veem sugestões"
  on public.sugestoes for select using (auth.role() = 'authenticated');

create policy "Autenticados criam sugestões"
  on public.sugestoes for insert with check (auth.uid() = usuario_id);

create policy "Autor exclui sua sugestão"
  on public.sugestoes for delete using (auth.uid() = usuario_id);

create policy "Admin gerencia todas as sugestões"
  on public.sugestoes for all using (public.is_admin());

-- ── Votos em sugestões (um por usuário, togglable) ────────────
create table if not exists public.sugestoes_votos (
  id           uuid primary key default gen_random_uuid(),
  sugestao_id  uuid references public.sugestoes on delete cascade not null,
  usuario_id   uuid references public.profiles on delete cascade not null,
  created_at   timestamptz default now(),
  unique (sugestao_id, usuario_id)
);

alter table public.sugestoes_votos enable row level security;

create policy "Autenticados veem votos"
  on public.sugestoes_votos for select using (auth.role() = 'authenticated');

create policy "Usuário gerencia seu próprio voto"
  on public.sugestoes_votos for all using (auth.uid() = usuario_id);
