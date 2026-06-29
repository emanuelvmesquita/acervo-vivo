-- Corrige recursão infinita nas políticas RLS de profiles
-- O problema: políticas de admin fazem subquery em profiles dentro de uma policy de profiles → loop infinito
-- A solução: função security definer que lê profiles sem acionar RLS

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and perfil = 'administrador'
  );
$$;

-- Recria as políticas problemáticas usando a função

drop policy if exists "Admin vê todos os perfis" on public.profiles;
drop policy if exists "Admin gerencia todos os perfis" on public.profiles;

create policy "Admin vê todos os perfis"
  on public.profiles for select using (public.is_admin());

create policy "Admin gerencia todos os perfis"
  on public.profiles for all using (public.is_admin());

-- Corrige as mesmas políticas em outras tabelas

drop policy if exists "Admin gerencia log de notificações" on public.notificacoes_log;
create policy "Admin gerencia log de notificações"
  on public.notificacoes_log for all using (public.is_admin());

drop policy if exists "Admin atualiza config" on public.config_notif;
create policy "Admin atualiza config"
  on public.config_notif for update using (public.is_admin());
