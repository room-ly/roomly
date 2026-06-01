-- 家賃請求の支払期限を「当月末」に統一する。
--
-- 背景:
--   従来は cron / デモシード ともに「翌月末」を支払期限にしていた（YYYY-MM-27 等）。
--   日本の賃貸慣行に合わせ「当月分を当月末払い」に変更する。
--
--   このマイグレーションでは:
--     1. 既存 rent_billings の due_date を billing_month と同月末日に補正
--     2. reset_demo_data() のシード生成も同月末日に変更
--   関連: kanri/src/app/api/cron/rent-billings/route.ts の dueDateOf()

-- 1. 既存データの補正: billing_month と同月の末日を支払期限にする
update public.rent_billings
   set due_date = (date_trunc('month', billing_month::date) + interval '1 month' - interval '1 day')::date
 where billing_month is not null;

-- 2. デモシード関数を更新: due_date を billing_month の月末日に
create or replace function public.reset_demo_data(demo_company_id uuid)
returns void
language plpgsql
security definer
as $reset_demo_data$
declare
  v_today date := current_date;
  v_cur_month date := date_trunc('month', current_date)::date;
  v_months date[];
  v_month date;
  v_idx int;
  v_contract_ids uuid[] := array[
    'f0000000-0000-0000-0000-000000000007'::uuid,
    'f0000000-0000-0000-0000-000000000005'::uuid,
    'f0000000-0000-0000-0000-000000000001'::uuid,
    'f0000000-0000-0000-0000-000000000002'::uuid,
    'f0000000-0000-0000-0000-000000000006'::uuid,
    'f0000000-0000-0000-0000-000000000008'::uuid,
    'f0000000-0000-0000-0000-000000000003'::uuid,
    'f0000000-0000-0000-0000-000000000004'::uuid,
    'f0000000-0000-0000-0000-000000000009'::uuid
  ];
  v_rents int[] := array[65000, 72000, 85000, 85000, 105000, 110000, 120000, 160000, 200000];
  v_mgmt int[] := array[3000, 4000, 5000, 5000, 6000, 8000, 8000, 10000, 12000];
  v_miss_total int[] := array[0, 1, 1, 1, 0, 2];
  v_banks text[][] := array[
    ['三菱UFJ銀行', '新宿支店'],
    ['三井住友銀行', '渋谷支店'],
    ['みずほ銀行', '中野支店'],
    ['りそな銀行', '杉並支店'],
    ['ゆうちょ銀行', '〇一八店'],
    ['住信SBIネット銀行', 'イチゴ支店'],
    ['楽天銀行', 'ジャズ支店'],
    ['PayPay銀行', 'ビジネス営業部'],
    ['GMOあおぞらネット銀行', '法人営業部']
  ];
  v_holders text[] := array[
    'カトウマコト',
    'ナカムラショウタ',
    'ヤマダケンタ',
    'タカハシミサキ',
    'コバヤシユミ',
    'ヨシダアカネ',
    'イトウダイスケ',
    'ワタナベサクラ',
    'マツモトタカシ'
  ];
  v_status text;
  v_total int;
  v_billing_id uuid;
  v_due date;
  i int;
begin
  delete from public.documents where company_id = demo_company_id;
  delete from public.inquiry_logs where inquiry_id in (
    select id from public.inquiries where company_id = demo_company_id
  );
  delete from public.inquiries where company_id = demo_company_id;
  delete from public.maintenance_logs where request_id in (
    select id from public.maintenance_requests where company_id = demo_company_id
  );
  delete from public.maintenance_requests where company_id = demo_company_id;
  delete from public.owner_remittance_items where remittance_id in (
    select id from public.owner_remittances where company_id = demo_company_id
  );
  delete from public.owner_remittances where company_id = demo_company_id;
  delete from public.rent_payments where company_id = demo_company_id;
  delete from public.rent_billings where company_id = demo_company_id;
  delete from public.expenses where company_id = demo_company_id;
  delete from public.contracts where company_id = demo_company_id;
  delete from public.tenants where company_id = demo_company_id;
  delete from public.vacancies where company_id = demo_company_id;
  delete from public.units where property_id in (
    select id from public.properties where company_id = demo_company_id
  );
  delete from public.properties where company_id = demo_company_id;
  delete from public.owners where company_id = demo_company_id;

  insert into public.owners (id, company_id, name, phone, email, bank_name, bank_branch, bank_account_type, bank_account_number, bank_account_holder, bank_code, bank_branch_code) values
    ('b0000000-0000-0000-0000-000000000001', demo_company_id, '田中 太郎', '09012345678', 'tanaka@example.com', 'みずほ銀行',   '東京営業部', 'ordinary', '1234567', 'タナカ タロウ',   '0001', '001'),
    ('b0000000-0000-0000-0000-000000000002', demo_company_id, '鈴木 花子', '09023456789', 'suzuki@example.com', '三菱UFJ銀行', '新宿支店',   'ordinary', '2345678', 'スズキ ハナコ',   '0005', '341'),
    ('b0000000-0000-0000-0000-000000000003', demo_company_id, '佐藤 一郎', '09034567890', 'sato@example.com',   '三井住友銀行', '渋谷支店',   'ordinary', '3456789', 'サトウ イチロウ', '0009', '259');

  insert into public.properties (id, company_id, owner_id, name, property_type, address, structure, floors, built_year, total_units, nearest_station, walk_minutes, management_fee_rate) values
    ('c0000000-0000-0000-0000-000000000001', demo_company_id, 'b0000000-0000-0000-0000-000000000001', 'グランメゾン新宿',   'apartment', '東京都新宿区西新宿1-1-1',   'RC',  10, 2015, 30, '新宿駅',   5, 5.0),
    ('c0000000-0000-0000-0000-000000000002', demo_company_id, 'b0000000-0000-0000-0000-000000000001', 'リバーサイド中野',   'apartment', '東京都中野区中央2-3-4',     'SRC', 8,  2018, 24, '中野駅',   8, 5.0),
    ('c0000000-0000-0000-0000-000000000003', demo_company_id, 'b0000000-0000-0000-0000-000000000002', 'サンライズ杉並',     'apartment', '東京都杉並区高円寺北3-5-6', 'RC',  5,  2010, 15, '高円寺駅', 3, 5.0),
    ('c0000000-0000-0000-0000-000000000004', demo_company_id, 'b0000000-0000-0000-0000-000000000003', 'パークハイツ渋谷',   'apartment', '東京都渋谷区道玄坂1-2-3',   'SRC', 12, 2020, 40, '渋谷駅',   6, 4.5);

  insert into public.units (id, company_id, property_id, unit_number, floor, layout, area_sqm, rent, management_fee, status) values
    ('d0000000-0000-0000-0000-000000000001', demo_company_id, 'c0000000-0000-0000-0000-000000000001', '101', 1, '1K',   25.0,  85000,  5000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000002', demo_company_id, 'c0000000-0000-0000-0000-000000000001', '102', 1, '1K',   25.0,  85000,  5000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000003', demo_company_id, 'c0000000-0000-0000-0000-000000000001', '201', 2, '1LDK', 40.0, 120000,  8000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000004', demo_company_id, 'c0000000-0000-0000-0000-000000000001', '202', 2, '1LDK', 40.0, 120000,  8000, 'vacant'),
    ('d0000000-0000-0000-0000-000000000005', demo_company_id, 'c0000000-0000-0000-0000-000000000001', '301', 3, '2LDK', 55.0, 160000, 10000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000006', demo_company_id, 'c0000000-0000-0000-0000-000000000002', '101', 1, '1K',   22.0,  72000,  4000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000007', demo_company_id, 'c0000000-0000-0000-0000-000000000002', '102', 1, '1K',   22.0,  72000,  4000, 'vacant'),
    ('d0000000-0000-0000-0000-000000000008', demo_company_id, 'c0000000-0000-0000-0000-000000000002', '201', 2, '1LDK', 38.0, 105000,  6000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000009', demo_company_id, 'c0000000-0000-0000-0000-000000000003', '101', 1, '1K',   20.0,  65000,  3000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000010', demo_company_id, 'c0000000-0000-0000-0000-000000000003', '201', 2, '2DK',  42.0,  95000,  5000, 'vacant'),
    ('d0000000-0000-0000-0000-000000000011', demo_company_id, 'c0000000-0000-0000-0000-000000000004', '101', 1, '1K',   28.0, 110000,  8000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000012', demo_company_id, 'c0000000-0000-0000-0000-000000000004', '501', 5, '2LDK', 60.0, 200000, 12000, 'occupied'),
    ('d0000000-0000-0000-0000-000000000013', demo_company_id, 'c0000000-0000-0000-0000-000000000004', '502', 5, '2LDK', 60.0, 200000, 12000, 'maintenance');

  insert into public.tenants (id, company_id, name, name_kana, phone, email, workplace) values
    ('e0000000-0000-0000-0000-000000000001', demo_company_id, '山田 健太',   'ヤマダ ケンタ',     '08011112222', 'yamada@example.com',     '株式会社テック'),
    ('e0000000-0000-0000-0000-000000000002', demo_company_id, '高橋 美咲',   'タカハシ ミサキ',   '08033334444', 'takahashi@example.com',  'デザイン事務所'),
    ('e0000000-0000-0000-0000-000000000003', demo_company_id, '伊藤 大輔',   'イトウ ダイスケ',   '08055556666', 'ito@example.com',        '商社株式会社'),
    ('e0000000-0000-0000-0000-000000000004', demo_company_id, '渡辺 さくら', 'ワタナベ サクラ',   '08077778888', 'watanabe@example.com',   '看護師'),
    ('e0000000-0000-0000-0000-000000000005', demo_company_id, '中村 翔太',   'ナカムラ ショウタ', '08099990000', 'nakamura@example.com',   'フリーランス'),
    ('e0000000-0000-0000-0000-000000000006', demo_company_id, '小林 由美',   'コバヤシ ユミ',     '08012345678', 'kobayashi@example.com',  '出版社'),
    ('e0000000-0000-0000-0000-000000000007', demo_company_id, '加藤 誠',     'カトウ マコト',     '08023456789', 'kato@example.com',       '銀行'),
    ('e0000000-0000-0000-0000-000000000008', demo_company_id, '吉田 あかね', 'ヨシダ アカネ',     '08034567890', 'yoshida@example.com',    'IT企業'),
    ('e0000000-0000-0000-0000-000000000009', demo_company_id, '松本 隆',     'マツモト タカシ',   '08045678901', 'matsumoto@example.com',  '教師');

  insert into public.contracts (id, company_id, unit_id, tenant_id, contract_type, start_date, end_date, rent, management_fee, status, move_in_date) values
    ('f0000000-0000-0000-0000-000000000001', demo_company_id, 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'ordinary', '2024-04-01', '2026-03-31',  85000, 5000, 'active', '2024-04-01'),
    ('f0000000-0000-0000-0000-000000000002', demo_company_id, 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'fixed',    '2025-01-01', '2026-12-31',  85000, 5000, 'active', '2025-01-01'),
    ('f0000000-0000-0000-0000-000000000003', demo_company_id, 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'ordinary', '2023-07-01', '2025-06-30', 120000, 8000, 'active', '2023-07-01'),
    ('f0000000-0000-0000-0000-000000000004', demo_company_id, 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000004', 'ordinary', '2024-10-01', '2026-09-30', 160000,10000, 'active', '2024-10-01'),
    ('f0000000-0000-0000-0000-000000000005', demo_company_id, 'd0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000005', 'fixed',    '2025-02-01', '2027-01-31',  72000, 4000, 'active', '2025-02-01'),
    ('f0000000-0000-0000-0000-000000000006', demo_company_id, 'd0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000006', 'ordinary', '2024-06-01', '2026-05-31', 105000, 6000, 'active', '2024-06-01'),
    ('f0000000-0000-0000-0000-000000000007', demo_company_id, 'd0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000007', 'ordinary', '2023-04-01', '2025-03-31',  65000, 3000, 'active', '2023-04-01'),
    ('f0000000-0000-0000-0000-000000000008', demo_company_id, 'd0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000008', 'fixed',    '2025-01-01', '2026-12-31', 110000, 8000, 'active', '2025-01-01'),
    ('f0000000-0000-0000-0000-000000000009', demo_company_id, 'd0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000009', 'ordinary', '2024-08-01', '2026-07-31', 200000,12000, 'active', '2024-08-01');

  insert into public.maintenance_requests (id, company_id, property_id, unit_id, tenant_id, title, description, category, priority, status, reported_date, completed_date, vendor_name, estimated_cost, actual_cost, source) values
    ('20000000-0000-0000-0000-000000000001', demo_company_id, 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'エアコン故障', '冷房が効かない。室外機から異音がする。', 'equipment', 'high',   'in_progress', v_today - 30, null,         'エアコン修理センター', 35000, null,  'admin'),
    ('20000000-0000-0000-0000-000000000002', demo_company_id, 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000005', '水漏れ',       'キッチン下から水漏れ。',                 'plumbing',  'urgent', 'open',        v_today - 5,  null,         null,                    null, null,  'admin'),
    ('20000000-0000-0000-0000-000000000003', demo_company_id, 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000013', null,                                     '退去後リフォーム', '壁紙張替え、クリーニング',          'other',     'normal', 'open',        v_today - 10, null,         null,                  180000, null,  'admin'),
    ('20000000-0000-0000-0000-000000000004', demo_company_id, 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000007', '給湯器の調子が悪い', 'お湯の温度が安定しない',           'equipment', 'normal', 'completed',   v_today - 40, v_today - 30, '設備メンテナンス',     15000, 12000, 'admin');

  insert into public.inquiries (id, company_id, property_id, unit_id, tenant_id, inquiry_type, title, description, status, priority) values
    ('30000000-0000-0000-0000-000000000001', demo_company_id, 'c0000000-0000-0000-0000-000000000001', null, 'e0000000-0000-0000-0000-000000000001', 'noise', '上階の騒音', '夜間の足音が気になる', 'in_progress', 'normal');
  update public.inquiries set created_at = now() - interval '3 days', updated_at = now() - interval '3 days'
    where id = '30000000-0000-0000-0000-000000000001';

  insert into public.expenses (id, company_id, property_id, unit_id, owner_id, category, description, amount, expense_date, is_owner_charge) values
    ('40000000-0000-0000-0000-000000000001', demo_company_id, 'c0000000-0000-0000-0000-000000000001', null,                                      'b0000000-0000-0000-0000-000000000001', 'repair',    '共用部廊下LED照明交換',         45000,  v_today - 15, true),
    ('40000000-0000-0000-0000-000000000002', demo_company_id, 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'cleaning',  '102号室 退去後クリーニング',     35000,  v_today - 20, true),
    ('40000000-0000-0000-0000-000000000003', demo_company_id, 'c0000000-0000-0000-0000-000000000003', null,                                      'b0000000-0000-0000-0000-000000000002', 'insurance', '火災保険(年額)',               120000,  v_today - 100, true),
    ('40000000-0000-0000-0000-000000000004', demo_company_id, 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'repair',    '502号室 壁紙張替え',            85000,  v_today - 5,  true),
    ('40000000-0000-0000-0000-000000000005', demo_company_id, 'c0000000-0000-0000-0000-000000000001', null,                                      null,                                    'utility',   '共用部電気代',                  18500,  v_today - 2,  false),
    ('40000000-0000-0000-0000-000000000006', demo_company_id, 'c0000000-0000-0000-0000-000000000004', null,                                      'b0000000-0000-0000-0000-000000000003', 'tax',       '固定資産税',                   250000,  v_today - 25, true);

  v_months := array(
    select (v_cur_month - (make_interval(months => 5 - g))::interval)::date
    from generate_series(0, 5) g
  );

  for v_idx in 1..6 loop
    v_month := v_months[v_idx];
    -- 当月分を当月末払い
    v_due := (date_trunc('month', v_month) + interval '1 month' - interval '1 day')::date;
    for i in 1..9 loop
      v_total := v_rents[i] + v_mgmt[i];
      if i <= v_miss_total[v_idx] then
        v_status := 'unpaid';
      else
        v_status := 'paid';
      end if;

      v_billing_id := gen_random_uuid();
      insert into public.rent_billings (id, company_id, contract_id, billing_month, rent, management_fee, other_amount, total_amount, due_date, status)
      values (
        v_billing_id, demo_company_id, v_contract_ids[i], v_month,
        v_rents[i], v_mgmt[i], 0, v_total,
        v_due,
        v_status
      );

      if v_status = 'paid' then
        insert into public.rent_payments (company_id, billing_id, amount, payment_date, payment_method, notes)
        values (
          demo_company_id, v_billing_id, v_total,
          (v_due - ((i % 5))::int)::date,
          'transfer',
          '振込元: ' || v_banks[1 + (i + v_idx) % array_length(v_banks, 1)][1]
                    || ' ' || v_banks[1 + (i + v_idx) % array_length(v_banks, 1)][2]
                    || ' 普通 ' || v_holders[i]
        );
      end if;
    end loop;
  end loop;

  update public.contracts
    set move_out_date = (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date
    where id = 'f0000000-0000-0000-0000-000000000006';
end;
$reset_demo_data$;
