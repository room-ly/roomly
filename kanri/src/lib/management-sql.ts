// Supabase Management API の database/query で生SQLを実行するための共通ヘルパー。
//
// なぜこれが必要か（重要・再発防止）:
//   database/query 経由の実行は PostgREST を通らないため、監査トリガー log_audit() が
//   auth.uid() も request.headers の X-Actor-Id も拾えず、audit_logs.user_id が NULL になる。
//   過去にデモリセット cron とマイグレーションでこの穴を踏み、大量の NULL 行が発生した。
//
// この経路で業務テーブル（contracts / rent_billings 等、監査トリガー付きテーブル）を
// 触る生SQLを実行するときは、必ずトランザクション先頭で
//   SET LOCAL request.headers = '{"x-actor-id":"<操作者UUID>"}';
//   を入れて、トリガーが操作者を記録できるようにすること。
//
// このヘルパーを使えば actor の付与漏れが構造的に起きない。
// 生SQLを自前で組んで database/query を直叩きするのは避け、ここを通すこと。

import { SYSTEM_USER_ID } from "@/lib/system-user";

const DEFAULT_PROJECT_REF = "grtiixrpqwsvxsfapsni";

export type ManagementSqlResult<T> =
  | { ok: true; data: T[] }
  | { ok: false; error: string };

type RunOptions = {
  // 監査ログに記録する操作者ID。
  //   - cron / system 起点で操作者が存在しない処理 → SYSTEM_USER_ID（デフォルト）
  //   - ユーザー代理実行 → そのユーザーの auth.users.id
  //   - 監査トリガーに一切関与しない参照系SQL（SELECT のみ等）→ null を渡してラップを省く
  actorId?: string | null;
  accessToken?: string;
  projectRef?: string;
};

// SQLリテラルとしての最小エスケープ（シングルクォートのみ）
function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Management API の database/query で生SQLを実行する。
 *
 * actorId が指定されている場合（デフォルト SYSTEM_USER_ID）、SQL全体を
 * BEGIN; SET LOCAL request.headers = ...; <SQL> COMMIT; で包み、
 * 監査トリガーが user_id を記録できるようにする。
 *
 * 既に呼び出し側で BEGIN/COMMIT と SET LOCAL を組み込んでいる場合は actorId: null を渡し、
 * 二重ラップを避けること。
 */
export async function runManagementSql<T = unknown>(
  query: string,
  options: RunOptions = {},
): Promise<ManagementSqlResult<T>> {
  const accessToken = options.accessToken ?? process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    return { ok: false, error: "SUPABASE_ACCESS_TOKEN missing" };
  }
  const projectRef =
    options.projectRef ?? process.env.SUPABASE_PROJECT_REF ?? DEFAULT_PROJECT_REF;

  // actorId の解決: undefined はデフォルトでシステム実行扱い。明示的に null なら包まない。
  const actorId =
    options.actorId === null ? null : options.actorId ?? SYSTEM_USER_ID;

  const finalQuery =
    actorId === null
      ? query
      : [
          "BEGIN;",
          `SET LOCAL request.headers = ${sqlLiteral(JSON.stringify({ "x-actor-id": actorId }))};`,
          query,
          "COMMIT;",
        ].join("\n");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: finalQuery }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${text}` };
  }

  const body = (await res.json()) as T[] | { message: string };
  if (!Array.isArray(body) && "message" in body) {
    return { ok: false, error: body.message };
  }
  return { ok: true, data: body as T[] };
}
