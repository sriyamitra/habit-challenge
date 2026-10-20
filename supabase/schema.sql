-- =============================================================
-- Habit Challenge — Supabase schema
-- Paste this whole file into Supabase › SQL Editor › New query › Run.
-- Safe to run once on a fresh project.
-- =============================================================


-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  start_date date not null,
  days int not null default 20 check (days between 1 and 365),
  stake text not null default '',
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  color text not null default 'orange',
  position int not null default 0
);

create table public.members (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  photo_path text not null,
  created_at timestamptz not null default now(),
  unique (habit_id, user_id, day)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  photo_path text,
  habit_id uuid references public.habits (id) on delete set null,
  created_at timestamptz not null default now()
);
create index messages_challenge_created on public.messages (challenge_id, created_at desc);

create table public.cheers (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  primary key (message_id, user_id)
);

-- ---------- Helpers ----------

create or replace function public.is_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where challenge_id = cid and user_id = auth.uid());
$$;

create or replace function public.shares_challenge_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members a join public.members b on a.challenge_id = b.challenge_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- New sign-up → empty profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create a challenge with its habits; creator becomes the first member
create or replace function public.create_challenge(
  p_name text, p_start date, p_days int, p_stake text, p_habits jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
  code text;
  h jsonb;
  i int := 0;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if jsonb_array_length(p_habits) < 1 or jsonb_array_length(p_habits) > 6 then
    raise exception 'A challenge needs 1 to 6 habits';
  end if;
  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.challenges where invite_code = code);
  end loop;
  insert into public.challenges (name, start_date, days, stake, invite_code, created_by)
    values (p_name, p_start, p_days, coalesce(p_stake, ''), code, auth.uid())
    returning id into cid;
  for h in select * from jsonb_array_elements(p_habits) loop
    insert into public.habits (challenge_id, title, color, position)
      values (cid, h->>'title', coalesce(h->>'color', 'orange'), i);
    i := i + 1;
  end loop;
  insert into public.members (challenge_id, user_id) values (cid, auth.uid());
  return cid;
end;
$$;

-- Join with an invite code
create or replace function public.join_challenge(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into cid from public.challenges where invite_code = upper(trim(p_code));
  if cid is null then raise exception 'No challenge with that code'; end if;
  insert into public.members (challenge_id, user_id) values (cid, auth.uid())
    on conflict do nothing;
  return cid;
end;
$$;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.habits enable row level security;
alter table public.members enable row level security;
alter table public.checkins enable row level security;
alter table public.messages enable row level security;
alter table public.cheers enable row level security;

create policy "see own and co-member profiles" on public.profiles for select
  using (id = auth.uid() or public.shares_challenge_with(id));
create policy "update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members see challenge" on public.challenges for select
  using (public.is_member(id));
create policy "creator edits challenge" on public.challenges for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "members see habits" on public.habits for select
  using (public.is_member(challenge_id));

create policy "members see members" on public.members for select
  using (public.is_member(challenge_id));
create policy "leave a challenge" on public.members for delete
  using (user_id = auth.uid());

create policy "members see checkins" on public.checkins for select
  using (public.is_member(challenge_id));
create policy "add own checkin" on public.checkins for insert
  with check (user_id = auth.uid() and public.is_member(challenge_id));
create policy "remove own checkin" on public.checkins for delete
  using (user_id = auth.uid());

create policy "members read chat" on public.messages for select
  using (public.is_member(challenge_id));
create policy "members post to chat" on public.messages for insert
  with check (user_id = auth.uid() and public.is_member(challenge_id));
create policy "delete own message" on public.messages for delete
  using (user_id = auth.uid());

create policy "members see cheers" on public.cheers for select
  using (public.is_member(challenge_id));
create policy "add own cheer" on public.cheers for insert
  with check (user_id = auth.uid() and public.is_member(challenge_id));
create policy "remove own cheer" on public.cheers for delete
  using (user_id = auth.uid());

-- ---------- Photo storage ----------
-- Private bucket; files live at <challenge_id>/<user_id>/<file>.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "members view challenge photos" on storage.objects for select
  using (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members upload own photos" on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and public.is_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "delete own photos" on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.messages, public.checkins, public.cheers, public.members;

-- ---------- Update 002: edit / delete (also in 002-edit-delete.sql) ----------
create or replace function public.is_creator(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.challenges where id = cid and created_by = auth.uid());
$$;
create policy "creator deletes challenge" on public.challenges for delete using (created_by = auth.uid());
create policy "creator adds habits" on public.habits for insert with check (public.is_creator(challenge_id));
create policy "creator edits habits" on public.habits for update using (public.is_creator(challenge_id)) with check (public.is_creator(challenge_id));
create policy "creator removes habits" on public.habits for delete using (public.is_creator(challenge_id));
create policy "creator removes members" on public.members for delete using (public.is_creator(challenge_id));
