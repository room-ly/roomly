-- 契約に「締日」と「締日からの月オフセット」を追加し、家賃請求生成を柔軟にする。
--
-- 背景:
--   家賃の支払サイクルは契約ごとに異なる。
--     例1: 月末締め・翌月末払い → closing_day=31, payment_due_day=31, payment_month_offset=1
--     例2: 月末締め・当月末払い（前家賃） → closing_day=31, payment_due_day=31, payment_month_offset=0
--     例3: 20日締め・翌月10日払い → closing_day=20, payment_due_day=10, payment_month_offset=1
--
--   billing_month は「締日が属する月」を表す。closing_day がその月に存在しない日（2/31等）
--   の場合は月末日として扱う（アプリ側で丸める）。
--
--   このマイグレーションでは:
--     1. closing_day (1-31, default 31) と payment_month_offset (0 or 1, default 1) を追加
--     2. 既存契約はデフォルトで「月末締め・翌月末払い」になる
--   関連: kanri/src/lib/billing-status.ts

alter table public.contracts
  add column if not exists closing_day smallint not null default 31
    check (closing_day between 1 and 31);

alter table public.contracts
  add column if not exists payment_month_offset smallint not null default 1
    check (payment_month_offset in (0, 1));

comment on column public.contracts.closing_day is
'家賃の毎月の締日（1-31）。指定日がその月に無い場合は月末に丸める。billing_month はこの日が属する月。';

comment on column public.contracts.payment_month_offset is
'締日から何ヶ月後に支払うか。0=当月（前家賃）、1=翌月（後家賃）。';
