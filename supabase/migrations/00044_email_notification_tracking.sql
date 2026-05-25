-- メール通知の重複送信防止用カラム
-- Cron（日次）が同じ滞納・契約満了に毎日メールを送らないよう、最終送信日を記録する

-- 家賃滞納通知の最終送信日
alter table public.rent_billings
  add column if not exists overdue_notified_at date;

-- 契約満了リマインダーの最終送信日
alter table public.contracts
  add column if not exists expiry_notified_at date;
