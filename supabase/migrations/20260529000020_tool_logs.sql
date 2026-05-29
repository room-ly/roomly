-- HP計算ツールの利用ログ
-- 入力値・IP・user-agentを記録し、改善やマーケ分析に使う

create table if not exists public.tool_logs (
  id bigserial primary key,
  tool_slug text not null,
  inputs jsonb not null,
  result jsonb,
  ip text,
  user_agent text,
  referer text,
  created_at timestamptz not null default now()
);

create index if not exists tool_logs_tool_slug_created_idx
  on public.tool_logs (tool_slug, created_at desc);

create index if not exists tool_logs_created_at_idx
  on public.tool_logs (created_at desc);

alter table public.tool_logs enable row level security;

-- 書き込みはAPI側のservice roleのみ
-- anon/authenticatedからの直接書き込みは禁止
revoke all on public.tool_logs from anon, authenticated;
grant all on public.tool_logs to service_role;
grant usage, select on sequence public.tool_logs_id_seq to service_role;

comment on table public.tool_logs is 'hp.roomly.jpの計算ツール利用ログ。入力値とIPを記録';
