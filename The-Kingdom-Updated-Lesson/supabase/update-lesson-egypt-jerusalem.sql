-- The Kingdom lesson update: Egypt/Jerusalem two-kingdom structure
-- Run this on an existing Supabase project after deploying the updated 33-slide app.

begin;

alter table public.presentation_state
  drop constraint if exists presentation_state_current_slide_check;

alter table public.presentation_state
  add constraint presentation_state_current_slide_check
  check (current_slide between 0 and 32);

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

update public.presentation_state
set current_slide = least(current_slide, 32),
    active_poll_id = null,
    poll_results_visible = false,
    updated_at = now()
where id = 'main';

commit;
