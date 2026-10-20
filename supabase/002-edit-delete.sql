-- =============================================================
-- Update 002: let the challenge creator edit or delete a challenge.
-- Paste into Supabase › SQL Editor › New query › Run (run once).
-- =============================================================

create or replace function public.is_creator(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.challenges where id = cid and created_by = auth.uid());
$$;

create policy "creator deletes challenge" on public.challenges for delete
  using (created_by = auth.uid());

create policy "creator adds habits" on public.habits for insert
  with check (public.is_creator(challenge_id));
create policy "creator edits habits" on public.habits for update
  using (public.is_creator(challenge_id)) with check (public.is_creator(challenge_id));
create policy "creator removes habits" on public.habits for delete
  using (public.is_creator(challenge_id));

-- Creator can also remove other members
create policy "creator removes members" on public.members for delete
  using (public.is_creator(challenge_id));
