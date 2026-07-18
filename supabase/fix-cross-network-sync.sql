-- The Kingdom: cross-network control and poll repair
-- Safe to run against an existing project. It restores state sync, poll functions, policies, grants, and Realtime publication.

begin;

create extension if not exists pgcrypto;

create table if not exists public.presentation_state (
  id text primary key,
  current_slide integer not null default 0 check (current_slide between 0 and 32),
  started boolean not null default false,
  started_at timestamptz,
  blackout boolean not null default false,
  active_scripture jsonb,
  scripture_visible boolean not null default false,
  active_poll_id text,
  poll_prompt_visible boolean not null default false,
  poll_results_visible boolean not null default false,
  reload_token bigint not null default 0,
  updated_at timestamptz not null default now()
);


-- Keep existing databases aligned with the current 33-slide lesson.
alter table public.presentation_state
  add column if not exists poll_prompt_visible boolean not null default false;

alter table public.presentation_state
  drop constraint if exists presentation_state_current_slide_check;

alter table public.presentation_state
  add constraint presentation_state_current_slide_check
  check (current_slide between 0 and 32);

create table if not exists public.polls (
  id text primary key,
  lesson_id text not null default 'when-the-kingdom-falls',
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  status text not null default 'closed' check (status in ('live', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.polls(id) on delete cascade,
  voter_token text not null,
  option_index integer not null check (option_index between 0 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, voter_token)
);

create index if not exists poll_votes_poll_id_idx on public.poll_votes (poll_id);

create table if not exists public.audience_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 3 and 800),
  status text not null default 'new' check (status in ('new', 'answered', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audience_questions_status_created_idx on public.audience_questions (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists presentation_state_updated_at on public.presentation_state;
create trigger presentation_state_updated_at
before update on public.presentation_state
for each row execute function public.set_updated_at();

drop trigger if exists polls_updated_at on public.polls;
create trigger polls_updated_at
before update on public.polls
for each row execute function public.set_updated_at();

drop trigger if exists poll_votes_updated_at on public.poll_votes;
create trigger poll_votes_updated_at
before update on public.poll_votes
for each row execute function public.set_updated_at();

drop trigger if exists audience_questions_updated_at on public.audience_questions;
create trigger audience_questions_updated_at
before update on public.audience_questions
for each row execute function public.set_updated_at();

insert into public.presentation_state (id)
values ('main')
on conflict (id) do nothing;

insert into public.polls (id, lesson_id, question, options, status)
values
  ('ignored-warning', 'when-the-kingdom-falls', 'Have you been ignoring a warning God has been giving you?', '["Yes","No","Not sure"]'::jsonb, 'closed'),
  ('where-drift-happens', 'when-the-kingdom-falls', 'Where does drift happen most for you?', '["Relationships","Private habits","Entertainment","Attitude","Pride"]'::jsonb, 'closed'),
  ('relief-or-surrender', 'when-the-kingdom-falls', 'What do you want most right now?', '["Relief","Surrender","Both","I’m not sure"]'::jsonb, 'closed'),
  ('mercy-response', 'when-the-kingdom-falls', 'What do you need to do with mercy today?', '["Repent","Ask for prayer","Change a boundary","Talk to a leader"]'::jsonb, 'closed')
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  question = excluded.question,
  options = excluded.options,
  updated_at = now();

alter table public.presentation_state enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.audience_questions enable row level security;

-- Public clients can only read the live state and poll definitions.
drop policy if exists presentation_state_public_read on public.presentation_state;
create policy presentation_state_public_read
on public.presentation_state
for select
to anon, authenticated
using (id = 'main');

drop policy if exists polls_public_read on public.polls;
create policy polls_public_read
on public.polls
for select
to anon, authenticated
using (lesson_id = 'when-the-kingdom-falls');

-- No direct public policies are created for votes or questions.
-- Audience writes go through the validated functions below.

create or replace function public.submit_poll_vote(
  p_poll_id text,
  p_voter_token text,
  p_option_index integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll public.polls%rowtype;
  v_id uuid;
begin
  if p_poll_id is null or length(trim(p_poll_id)) = 0 then
    raise exception 'Poll id required';
  end if;
  if p_voter_token is null or length(trim(p_voter_token)) < 8 or length(p_voter_token) > 180 then
    raise exception 'Invalid voter token';
  end if;

  select * into v_poll from public.polls where id = p_poll_id;
  if not found then raise exception 'Poll not found'; end if;
  if v_poll.status <> 'live' then raise exception 'Poll is closed'; end if;
  if p_option_index < 0 or p_option_index >= jsonb_array_length(v_poll.options) then
    raise exception 'Invalid poll option';
  end if;

  insert into public.poll_votes (poll_id, voter_token, option_index)
  values (p_poll_id, left(trim(p_voter_token), 180), p_option_index)
  on conflict (poll_id, voter_token)
  do update set option_index = excluded.option_index, updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.get_poll_results(p_poll_id text)
returns table(option_index integer, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select v.option_index, count(*)::bigint
  from public.poll_votes v
  where v.poll_id = p_poll_id
  group by v.option_index
  order by v.option_index;
$$;

create or replace function public.submit_audience_question(p_text text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_text text := regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g');
  v_id uuid;
begin
  v_text := trim(v_text);
  if char_length(v_text) < 3 then raise exception 'Question is too short'; end if;
  if char_length(v_text) > 800 then v_text := left(v_text, 800); end if;

  insert into public.audience_questions (text)
  values (v_text)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on table public.presentation_state from anon, authenticated;
revoke all on table public.polls from anon, authenticated;
revoke all on table public.poll_votes from anon, authenticated;
revoke all on table public.audience_questions from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.presentation_state to anon, authenticated;
grant select on table public.polls to anon, authenticated;

grant execute on function public.submit_poll_vote(text, text, integer) to anon, authenticated;
grant execute on function public.get_poll_results(text) to anon, authenticated;
grant execute on function public.submit_audience_question(text) to anon, authenticated;

alter table public.presentation_state replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'presentation_state'
  ) then
    execute 'alter publication supabase_realtime add table public.presentation_state';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;


-- Live system verification. Expected: realtime_enabled=true, state_row=true, poll_count=4.
select
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'presentation_state'
  ) as realtime_enabled,
  exists (select 1 from public.presentation_state where id = 'main') as state_row,
  (select count(*) from public.polls where lesson_id = 'when-the-kingdom-falls') as poll_count;
