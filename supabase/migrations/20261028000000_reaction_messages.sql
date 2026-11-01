-- Private reaction messages for "Where the Moon Meets You" (SRS §7.2, FR-045–FR-051).
--
-- Security model:
--   * Anonymous visitors have NO table access at all. Submissions go through the
--     `submit-reaction` Edge Function, which validates, rate-limits, and inserts
--     with the service role on the server.
--   * Only users listed in public.inbox_owners can read, update status, or delete.
--   * Everything is enforced by Row Level Security, not by the hidden route.

create table if not exists public.reaction_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 1000 and char_length(btrim(message, E' \t\r\n')) >= 1),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  read_at timestamptz,
  archived_at timestamptz
);

create index if not exists reaction_messages_created_at_idx on public.reaction_messages (created_at desc);

-- Who may open the private inbox. Add the owner's auth user id once (see README).
create table if not exists public.inbox_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Short-lived, hashed submission log used only for rate limiting. No message content.
create table if not exists public.reaction_rate_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists reaction_rate_limits_lookup_idx on public.reaction_rate_limits (ip_hash, created_at desc);

alter table public.reaction_messages enable row level security;
alter table public.inbox_owners enable row level security;
alter table public.reaction_rate_limits enable row level security;

create or replace function public.is_inbox_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.inbox_owners where user_id = (select auth.uid()));
$$;

revoke all on function public.is_inbox_owner() from public, anon;
grant execute on function public.is_inbox_owner() to authenticated;

-- Table privileges: nothing for anon; owners get read, status updates, and delete.
revoke all on public.reaction_messages from anon, authenticated;
revoke all on public.inbox_owners from anon, authenticated;
revoke all on public.reaction_rate_limits from anon, authenticated;

grant select, delete on public.reaction_messages to authenticated;
grant update (status, read_at, archived_at) on public.reaction_messages to authenticated;

drop policy if exists "Owner can read messages" on public.reaction_messages;
create policy "Owner can read messages" on public.reaction_messages
  for select to authenticated using ((select public.is_inbox_owner()));

drop policy if exists "Owner can update message status" on public.reaction_messages;
create policy "Owner can update message status" on public.reaction_messages
  for update to authenticated using ((select public.is_inbox_owner())) with check ((select public.is_inbox_owner()));

drop policy if exists "Owner can delete messages" on public.reaction_messages;
create policy "Owner can delete messages" on public.reaction_messages
  for delete to authenticated using ((select public.is_inbox_owner()));

-- No insert policy exists for anon or authenticated: inserts only happen server-side.
