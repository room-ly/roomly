# Roomly アーキテクチャ・スキーマ

## プロジェクト構成

```
roomly/
├── kanri/            ← 管理会社向けSaaS（Next.js App Router + TypeScript）
├── portal/           ← 入居者向け物件検索ポータル（Next.js App Router + TypeScript）
├── hp/               ← ホームページ（Next.js）
├── lp/               ← ランディングページ（Vite + React + TS）
├── supabase/         ← 共有バックエンド（DB / Auth / Storage）
│   └── migrations/
├── images/           ← ロゴ・素材
└── 事業運営/          ← 事業運営タスク管理
```

## 共有バックエンド（Supabase）

全アプリが同一のSupabase DBを参照する。スキーマは `supabase/migrations/` で管理。

### 主要テーブル一覧

| テーブル | 用途 |
|---------|------|
| companies | 管理会社（テナント） |
| users | 管理画面ユーザー（社員） |
| owners | 物件オーナー |
| properties | 物件（建物） |
| units | 部屋（区画） |
| tenants | 入居者 |
| contracts | 賃貸契約 |
| rent_billings | 家賃請求 |
| rent_payments | 家賃入金 |
| owner_remittances | オーナー送金 |
| owner_remittance_items | 送金明細 |
| expenses | 経費 |
| maintenance_requests | 修繕依頼 |
| maintenance_logs | 修繕対応履歴 |
| inquiries | 問い合わせ・クレーム |
| inquiry_logs | 対応履歴 |
| documents | 書類（契約書PDF、写真等） |
| vacancies | 空室募集情報 |

### RLS（Row Level Security）

全テーブルに `company_id` カラムがあり、JWT内の `company_id` クレームでフィルタする。
`public.company_id()` 関数でJWTからテナントIDを取得。

### ユーザーロール

| ロール | 権限 |
|--------|------|
| admin | 全機能（会社設定・ユーザー管理含む） |
| manager | 物件・契約・家賃・送金の管理 |
| staff | 日常業務（修繕受付・入金確認等） |
| viewer | 閲覧のみ |

## 機能スコープ（MVP）

### 物件系
- 物件管理（建物・部屋の登録、間取り・設備・写真）
- 空室管理（空室一覧、募集状況、内見予約）

### 契約系
- 入居者管理（個人情報、緊急連絡先、保証人）
- 契約管理（契約作成・更新・解約、契約条件、特約）
- 入退去管理（入居日程調整、退去立会、原状回復）

### 収支系
- 家賃管理（請求・入金確認・滞納追跡・督促）
- オーナー送金（月次精算、管理費差引、送金明細）
- 経費管理（修繕費、共用部費用、仕分け）

### 運用系
- 修繕/メンテナンス管理（依頼受付→業者手配→完了報告）
- クレーム/問い合わせ管理（対応履歴、ステータス追跡）
- 書類管理（契約書PDF、鍵預かり証、写真保管）

### レポート
- ダッシュボード（稼働率、入金率、滞納件数）
- オーナーレポート（月次収支報告書の自動生成）
- 物件収支分析

## ブランドカラー

| 名前 | Hex | 用途 |
|------|-----|------|
| primary | #1a365d | ヘッダー・ナビ背景（ネイビー） |
| accent | #2b6cb0 | ボタン・リンク |
| success | #2f855a | 入金済・正常 |
| warning | #c05621 | 滞納・注意 |
| danger | #c53030 | エラー・期限超過 |
| bg | #f7fafc | 背景 |
| card | #ffffff | カード背景 |

## portal（入居者向け物件検索ポータル）

### 概要
管理会社のDBから直接取得したリアルタイム空室情報を掲載する入居者向け物件検索サイト。
おとり物件が構造的に発生しない仕組み。

### ポジショニング
- 管理会社が**仲介会社を介さず直接客付け**できるポータル
- kanri導入会社の物件は**自動掲載**（追加作業ゼロ）
- 競合: ウチコミ！（大家手動掲載）、OHEYAGO（ITANDI BB+連動・東京23区中心）、airdoor（API連携・1都3県）

### 技術構成
- Next.js App Router + TypeScript + Tailwind CSS
- Supabase（kanriと同じDBを参照）
- anon ロールのRLSポリシーで active な空室のみ公開

### ページ構成
| パス | 内容 |
|------|------|
| `/` | 物件検索（エリア・間取り・家賃上限）+ 空室一覧 |
| `/rooms/[id]` | 物件詳細 + 問い合わせフォーム |
| `/api/inquiry` | 問い合わせ保存API（kanriのinquiriesテーブルに【ポータル】タグ付きで保存） |

### RLSポリシー（マイグレーション: 00033）
- vacancies: `listing_status = 'active'` のみ公開
- units: `status = 'vacant'` のみ公開
- properties: 空室がある物件のみ公開

### 将来の拡張
- kanri側にポータル掲載トグルUI追加
- kanriの物件データをAPI公開（外部サービス連携用）

## サブドメイン構成

| サブドメイン | 用途 | Vercelプロジェクト | ディレクトリ |
|------------|------|------------------|------------|
| hp.roomly.jp | 公式HP・コラム | roomly-hp | hp/ |
| kanri.roomly.jp | 管理会社向けkanri SaaS本体 | roomly-kanri | kanri/ |
| admin.roomly.jp | **Roomly運営者専用admin（独立プロジェクト）** | roomly-admin | admin/ |
| portal.roomly.jp | 入居者向け物件ポータル | roomly-portal | portal/ |
| sumai.roomly.jp | （roomly-sumai） | roomly-sumai | sumai/ |

### admin.roomly.jp 運用ルール

- **完全に独立したNext.jsプロジェクト**。kanriとはコード分離されている
- Supabase Auth は kanri と同じプロジェクトを参照（同じ users テーブル）
- アクセス可能アドレスは `ROOMLY_ADMIN_EMAILS` 環境変数で制御（roomly-admin Vercelに設定済み）
- ログインはメール/パスワード（Supabase Auth）。`/login` → 認証後 `/` → `/affiliates` にリダイレクト
- 非adminアドレスでログインしても `/forbidden` へリダイレクト（API側も403）
- パス構造: `/affiliates`, `/affiliates/[id]`, `/analytics`, `/api/affiliates`, `/api/analytics` 等（`/admin/` プレフィックスなし）
- 今後この admin プロジェクトに運営機能を集約していく（プロスペクト管理、支払い管理、複数SaaSの統合等）
- アフィリエイト関連の cron は引き続き kanri 側（`/api/cron/affiliate-recurring`）で動かす（DBは共通なので問題なし）

## 開発ステータス

| プロジェクト | 状態 | 優先度 |
|------------|------|--------|
| kanri | 全9画面UI実装済み（モック認証） | 最優先 |
| portal | 物件検索・詳細・問い合わせ実装済み（デプロイ前） | 高 |
| supabase | デプロイ済み（grtiixrpqwsvxsfapsni / Tokyo） | ✅ |
| hp / lp | セットアップのみ | 中 |
| marketing | 記事テンプレート作成済み | 中 |

## 事業情報

- 月額: フリーミアム（〜10区画 無料）/ 区画数ベース段階課金
  - 〜50区画: ¥5,000（税込）/月
  - 〜100区画: ¥10,000（税込）/月
  - 〜300区画: ¥15,000（税込）/月
  - 〜500区画: ¥20,000（税込）/月
  - 〜1,000区画: ¥25,000（税込）/月
  - 〜2,000区画: ¥30,000（税込）/月
  - 2,001区画〜: 1,000区画ごとに+¥5,000（税込）/月
