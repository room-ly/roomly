-- 部屋（units）から敷金・礼金カラムを削除し、契約（contracts）に一本化する。
-- 敷金・礼金は契約単位で取り決められるため、部屋側に持つと「募集条件」と「実際の契約」が
-- 混在して二重管理になる。募集情報としての敷礼は将来 vacancies 等で別管理する想定。

alter table public.units
  drop column if exists deposit,
  drop column if exists deposit_unit,
  drop column if exists key_money,
  drop column if exists key_money_unit;
