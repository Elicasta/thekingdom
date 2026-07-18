-- Destructive: clears all anonymous poll votes for this lesson.
-- Use this before a new event/session when you want fresh totals.
truncate table public.kingdom_poll_votes restart identity;
