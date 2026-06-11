# 振込バッチ（payment_batches）設計

## 目的

「送金（オーナー精算）」と「支払い（業者振込）」が別画面に分かれていて分かりにくい問題を解消する。
振り込む対象（オーナー送金 ＋ 業者支払い）を**1つの振込バッチ**にまとめ、振込日までに複数回振り込む運用・履歴・全銀CSV再出力を可能にする。

## 用語の整理（統合前→後）

送金画面は「a.精算の計算・確定」と「b.CSV出力」の2機能を持つ。b はバッチへ移動し、a だけ残す。

| 行為 | 現状の画面 | 統合後 |
|------|-----------|--------|
| a. オーナー精算を計算・確定 | 送金 `/remittances` | **「月次精算」として残す**（全オーナー一覧＝締めの俯瞰） |
| a'. オーナー個別の精算履歴 | （なし） | **オーナー詳細ページに追加** |
| b. オーナー送金のCSV出力 | 送金/支払い | バッチへ統合 |
| c. 業者支払いのCSV出力 | 支払い `/payments` | バッチへ統合 |

→ `/payments`（即CSV出力・バッチ未保存）は廃止し、振込バッチ画面に一本化。
→ `/remittances` は「月次精算」にリネーム。精算の計算・確定と全オーナー一覧（締め俯瞰）を残す。CSV出力ボタンは撤去（バッチへ）。
→ オーナー詳細にそのオーナーの精算履歴セクションを追加。

## 全銀CSVの振込指定日について

全銀フォーマットのヘッダーに振込指定日（MMDD）フィールドはあり、CSVに埋めている（zengin.ts）。
ただし実際の予約実行は銀行のネットバンキング側の確認画面で人間が承認する。
→ Roomly の `batch_date` は「希望振込日＋管理用ラベル」。バッチ側で予約実行は保証しない。

## データモデル

### payment_batches（振込の束＝実行単位）
- `id`, `company_id`
- `batch_date` date — 振込実行（予定）日。**同日複数バッチOK**（UNIQUE制約は付けない）
- `status` text — `draft`（編集中）/ `executed`（振込実行済み）。confirmed は使わず2状態に簡素化
- `total_amount` numeric(10,0)
- `sender_account_id` uuid — 振込元口座（company_bank_accounts）
- `notes` text
- `executed_at` timestamptz — 実行確定した日時
- `created_by` uuid, `created_at`, `updated_at`

### payment_batch_items（バッチ明細＝1振込行）
- `id`, `company_id`, `payment_batch_id`
- `item_type` text — `owner_remittance` / `expense`
- `owner_remittance_id` uuid / `expense_id` uuid（type に応じてどちらか一方）
- 受取人スナップショット: `recipient_name`, `bank_code`, `branch_code`, `account_type`, `account_number`, `account_holder_kana`, `amount`, `label`
  - **スナップショットで保持する理由**: 後で口座情報が変わっても「その時いくらをどこへ振り込んだか」の履歴が崩れない
- CHECK: item_type と link の整合（owner_remittance なら owner_remittance_id 必須・expense_id NULL、その逆）

両テーブルに RLS（`company_id = public.company_id()`）と log_audit トリガを付与。

## ステータス遷移と連動

```
振込候補を選ぶ（confirmed/sentでないowner_remittances ＋ paid_by=company/未払い/承認済みのexpenses）
  │ バッチ作成（items を口座情報スナップショットで生成、total_amount集計）
  ▼ status=draft
全銀CSV出力（何度でも再DL可。draftのまま）
  │ 銀行で振込実行
  ▼ 「振込実行済みにする」ボタン
status=executed ＋ executed_at記録
  ├ 各 owner_remittance_id → owner_remittances.status='sent', sent_date=batch_date
  └ 各 expense_id          → expenses.paid_at=batch_date（is null ガード）
```

- **二重計上防止**: draft バッチに入った owner_remittances / expenses は、他バッチの候補から除外する（既にバッチ入り＝拾わない）
- **execute は冪等**: 既に sent / paid_at 済みは上書きしない
- executed バッチは items / amount をトリガでロック（lock_sent_remittance に倣う）

## API

| メソッド | パス | 役割 |
|---------|------|------|
| GET | `/api/payment-batches` | バッチ一覧 |
| POST | `/api/payment-batches` | バッチ作成（remittance_ids + expense_ids → items生成） |
| GET | `/api/payment-batches/[id]` | バッチ詳細 |
| DELETE | `/api/payment-batches/[id]` | draftバッチ削除（候補に戻る） |
| POST | `/api/payment-batches/[id]/zengin-csv` | 全銀CSV出力（再DL可、draftのまま） |
| POST | `/api/payment-batches/[id]/execute` | 振込実行済みに確定＋連動更新 |

既存 `/api/payments/zengin-csv` は廃止（バッチ経由に移行）。

## UI

- サイドメニュー: 「送金」はそのまま、「支払い出力」→「**振込**」(`/payments` をバッチ一覧に置換)
- `/payments` = バッチ一覧（作成ボタン・status表示・合計額）
- `/payments/new` = 候補選択 → バッチ作成
- `/payments/[id]` = バッチ詳細（明細・CSV出力・振込実行済みボタン）

## 段階実装

1. マイグレーション（2テーブル＋RLS＋audit＋executedロックトリガ）
2. 候補取得クエリ（draftバッチ入りを除外）＋ バッチ作成サービス（スナップショット）
3. CSV出力（既存 generateZengin を再利用、items から生成）
4. execute（連動更新、冪等）
5. UI（一覧・作成・詳細）
6. サイドメニュー差し替え、旧 /payments と旧APIの撤去
