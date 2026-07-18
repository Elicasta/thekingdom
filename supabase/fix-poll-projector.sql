-- The Kingdom: make launched polls appear on the projector
-- Safe to run against an existing Supabase project.

begin;

alter table public.presentation_state
  add column if not exists poll_prompt_visible boolean not null default false;

update public.presentation_state
set poll_prompt_visible = false
where id = 'main';

alter table public.presentation_state replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.presentation_state;
  exception when duplicate_object then null;
  end;
end $$;

commit;
