import { NextResponse } from "next/server";
import { getProperties, getOwnersForSelect, getUsersForSelect } from "@/lib/queries";
import { createClient } from "@/lib/supabase-server";

// 一時的なRSC内訳計測用エンドポイント。物件ページが投げるクエリの各所要時間を測る。
// 計測が終わったら削除する。
export async function GET() {
  const marks: Record<string, number> = {};
  const time = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    const t = performance.now();
    const r = await fn();
    marks[key] = Math.round((performance.now() - t) * 10) / 10;
    return r;
  };

  // 接続オブジェクト生成（cookies読み取り含む）
  await time("createClient", async () => createClient());

  // auth.getUser のラウンドトリップ単体
  await time("auth.getUser", async () => {
    const s = await createClient();
    return s.auth.getUser();
  });

  // 物件ページと同じ3クエリを「直列」で測る（実際のpage.tsxはPromise.allで並列）
  const serialStart = performance.now();
  await time("getProperties", () => getProperties());
  await time("getOwnersForSelect", () => getOwnersForSelect());
  await time("getUsersForSelect", () => getUsersForSelect());
  const serialTotal = Math.round((performance.now() - serialStart) * 10) / 10;

  // 並列で測る（page.tsxの実態）
  const parStart = performance.now();
  await Promise.all([getProperties(), getOwnersForSelect(), getUsersForSelect()]);
  const parallelTotal = Math.round((performance.now() - parStart) * 10) / 10;

  return NextResponse.json({ marks, serialTotal, parallelTotal }, {
    headers: { "Cache-Control": "no-store" },
  });
}
