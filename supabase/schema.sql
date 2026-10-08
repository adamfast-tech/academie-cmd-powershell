-- Académie CMD & PowerShell : profils (nom d'utilisateur), progression et historique,
-- liés à Supabase Auth (e-mail + mot de passe). À exécuter une fois dans le SQL Editor du projet.

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null check (username ~ '^[A-Za-z0-9._-]{3,24}$'),
  created_at timestamptz not null default now()
);
create unique index profiles_username_ci on public.profiles (lower(username));
alter table public.profiles enable row level security;
create policy "Lire son profil" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Modifier son profil" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table public.progress (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  state        jsonb not null default '{}'::jsonb,
  xp           int not null default 0,
  lessons_done int not null default 0,
  streak       int not null default 0,
  updated_at   timestamptz not null default now(),
  constraint progress_state_object check (jsonb_typeof(state) = 'object'),
  constraint progress_state_size check (pg_column_size(state) < 200000)
);
alter table public.progress enable row level security;
create policy "Lire sa progression" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "Créer sa progression" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Mettre à jour sa progression" on public.progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.lesson_history (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lesson_id    text not null check (lesson_id ~ '^[a-z0-9-]{1,16}$'),
  mode         text not null check (mode in ('lesson', 'review', 'mission')),
  xp           int  not null check (xp between 0 and 100),
  accuracy     int  check (accuracy between 0 and 100),
  completed_at timestamptz not null default now()
);
create index lesson_history_user on public.lesson_history (user_id, completed_at desc);
alter table public.lesson_history enable row level security;
create policy "Lire son historique" on public.lesson_history for select to authenticated using ((select auth.uid()) = user_id);
create policy "Ajouter à son historique" on public.lesson_history for insert to authenticated with check ((select auth.uid()) = user_id);

-- Colonnes de synthèse calculées côté serveur à partir de l'état envoyé par le site.
create or replace function public.progress_summary()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.xp := least(greatest(coalesce(case when jsonb_typeof(new.state -> 'xp') = 'number' then (new.state ->> 'xp')::numeric end, 0), 0), 1000000)::int;
  new.lessons_done := case when jsonb_typeof(new.state -> 'done') = 'object'
                           then (select count(*) from jsonb_object_keys(new.state -> 'done'))::int else 0 end;
  new.streak := least(greatest(coalesce(case when jsonb_typeof(new.state #> '{streak,n}') = 'number' then (new.state #>> '{streak,n}')::numeric end, 0), 0), 100000)::int;
  new.updated_at := now();
  return new;
end $$;
create trigger progress_summary before insert or update on public.progress
  for each row execute function public.progress_summary();

-- À l'inscription : profil (nom d'utilisateur passé dans les métadonnées) + progression vide.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare u text := btrim(coalesce(new.raw_user_meta_data ->> 'username', ''));
begin
  if u !~ '^[A-Za-z0-9._-]{3,24}$' or exists (select 1 from public.profiles where lower(username) = lower(u)) then
    u := 'membre-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username) values (new.id, u);
  insert into public.progress (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vérifier qu'un nom d'utilisateur est libre avant l'inscription.
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select btrim(coalesce(p_username, '')) ~ '^[A-Za-z0-9._-]{3,24}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(btrim(p_username)));
$$;

-- Supprimer son propre compte (profil, progression et historique suivent en cascade).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.progress_summary() from public, anon, authenticated;
revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
