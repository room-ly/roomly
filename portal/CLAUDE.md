# Roomly Portal — 入居者向け物件検索ポータル

## 概要

管理会社のDBからリアルタイム空室情報を掲載する入居者向け物件検索サイト。
おとり物件が構造的に発生しない仕組み。管理会社が仲介会社を介さず直接客付けできる。

## 技術スタック

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase（kanriと同一DB / anon keyで接続）
- lucide-react（アイコン）

## ページ構成

| パス | 内容 |
|------|------|
| `/` | 物件検索（エリア・間取り・家賃上限）+ 空室一覧 |
| `/rooms/[id]` | 物件詳細 + 問い合わせフォーム |
| `/api/inquiry` | 問い合わせ保存API（service_role_key使用） |

## データフロー

- 空室データ: vacancies → units → properties のJOINで取得
- 問い合わせ: portalのフォーム → `/api/inquiry` → kanriのinquiriesテーブルに【ポータル】タグ付きで保存
- RLSポリシー: anon ロールで active な空室のみ閲覧可能（マイグレーション 00033）

## 共通ルール

- **言語**: 日本語で作業・出力
- **金額**: 全て税込で記載し、表示時は「（税込）」を必ず付記する
- **日付**: YYYY-MM-DD 形式
- **コミットメッセージ**: 日本語、簡潔に
- **秘密情報**: `.env`, credentials, API keyは絶対にコミットしない
- **DB変更**: 必ず `supabase/migrations/` にマイグレーションファイルを作成

## 開発

```bash
npm run dev   # http://localhost:3003
npm run build # ビルド確認
```
