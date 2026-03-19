begin;

-- Expand roadmap status constraint to support discarded ideas.
alter table roadmap
  drop constraint if exists roadmap_status_check;

alter table roadmap
  add constraint roadmap_status_check
  check (status in ('pending', 'in_progress', 'done', 'discarded'));

commit;

