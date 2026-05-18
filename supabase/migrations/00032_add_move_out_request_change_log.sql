alter table public.move_out_requests
  add column if not exists change_log text;
