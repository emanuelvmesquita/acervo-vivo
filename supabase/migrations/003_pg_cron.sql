-- ══════════════════════════════════════════════════════════════════
-- Onda 4 — pg_cron: auto-status de atraso + cron de notificações
-- ══════════════════════════════════════════════════════════════════
--
-- PRÉ-REQUISITO: habilitar as extensões no Supabase Dashboard:
--   Database → Extensions → pg_cron  → Enable
--   Database → Extensions → pg_net   → Enable
--
-- Depois rode este arquivo inteiro no SQL Editor do Supabase,
-- substituindo os dois placeholders no final:
--   <SUA_URL_VERCEL>   → ex: https://acervo-vivo.vercel.app
--   <SEU_CRON_SECRET>  → o valor que você gerou e salvou no Vercel
-- ══════════════════════════════════════════════════════════════════


-- ── 1. Função: marcar empréstimos vencidos como Atrasado ────────
create or replace function public.marcar_emprestimos_atrasados()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.emprestimos
  set status = 'Atrasado'
  where status = 'Ativo'
    and data_devolucao < current_date;
$$;

grant execute on function public.marcar_emprestimos_atrasados() to postgres;


-- ── 2. Cron: atualizar status todo dia às 07h BRT (10h UTC) ────
-- Remove job anterior se existir (idempotente)
select cron.unschedule('marcar-emprestimos-atrasados')
where exists (
  select 1 from cron.job where jobname = 'marcar-emprestimos-atrasados'
);

select cron.schedule(
  'marcar-emprestimos-atrasados',
  '0 10 * * *',
  'select public.marcar_emprestimos_atrasados()'
);


-- ── 3. Cron: disparar notificações todo dia às 08h BRT (11h UTC)
-- (Substitua os placeholders antes de executar)

select cron.unschedule('notificacoes-diarias')
where exists (
  select 1 from cron.job where jobname = 'notificacoes-diarias'
);

select cron.schedule(
  'notificacoes-diarias',
  '0 11 * * *',
  $$
    select net.http_post(
      url     := '<SUA_URL_VERCEL>/api/cron/notificacoes',
      headers := jsonb_build_object('Authorization', 'Bearer <SEU_CRON_SECRET>'),
      body    := '{}'::jsonb
    );
  $$
);


-- ── 4. Verificar jobs agendados ─────────────────────────────────
select jobid, jobname, schedule, command, active
from cron.job
order by jobname;
