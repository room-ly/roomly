-- アフィリエイト報酬体系の変更: 20%/24ヶ月 → 10%/無期限
--
-- 背景:
--   - LTVの長いSaaSなので「永年還元」のほうがアフィリエイターの本気度が上がる
--   - 「業界唯一の永年還元」を訴求軸にできる
--   - 短期重×長期軽 → 長期薄×ずっと、のキャッシュフロー設計に転換
--
-- commission_recurring_months = 0 は「無期限」を意味する。
-- cron側はこの値が0なら期間上限なしで継続報酬を計上する。

alter table public.affiliates
  alter column commission_recurring_rate set default 10.00,
  alter column commission_recurring_months set default 0;

-- 既存アフィリエイター（ゼロ件想定だが念のため）は新方針に合わせて更新する。
-- 旧条件（20% / 24ヶ月）のアフィリエイターのみ対象。個別契約で別レートが
-- 設定されているケースを巻き込まないため、デフォルト値完全一致のみ。
update public.affiliates
   set commission_recurring_rate = 10.00,
       commission_recurring_months = 0
 where commission_recurring_rate = 20.00
   and commission_recurring_months = 24;
