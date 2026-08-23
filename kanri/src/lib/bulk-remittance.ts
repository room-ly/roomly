// オーナー送金一括生成の判定ロジック（DBアクセスを含まない純粋関数）。
// route.ts 側はここで決めた分類に従って実際のDB操作を行う。

export interface BulkTarget {
  owner_id: string;
  owner_name: string;
  existing_remittance_id: string | null;
  has_bank: boolean;
}

export type BulkAction =
  | { kind: "create"; target: BulkTarget } // 新規に送金明細を作る
  | { kind: "reuse"; target: BulkTarget; remittance_id: string }; // 既存draftを確定だけする

// 候補オーナーを「新規作成」と「既存draft再利用」に振り分ける。
export function planBulkGeneration(targets: BulkTarget[]): BulkAction[] {
  return targets.map((t) =>
    t.existing_remittance_id
      ? { kind: "reuse" as const, target: t, remittance_id: t.existing_remittance_id }
      : { kind: "create" as const, target: t }
  );
}

// 口座情報が未登録＝確定できても振込対象に選べないオーナー。UI警告用。
export function ownersMissingBank(targets: BulkTarget[]): string[] {
  return targets.filter((t) => !t.has_bank).map((t) => t.owner_name);
}

export interface BulkSummary {
  generated: number;
  confirmed: number;
  skipped: number;
  failed: { owner_id: string; owner_name: string; reason: string }[];
}

// 実行結果から通知タイトルを組み立てる。
export function buildBulkNotificationTitle(month: string, s: BulkSummary): string {
  const parts = [`オーナー送金一括生成: ${month.slice(0, 7)}分 ${s.generated}件生成`];
  if (s.confirmed > 0) parts.push(`${s.confirmed}件確定`);
  if (s.failed.length > 0) parts.push(`${s.failed.length}件失敗`);
  return parts.join("・");
}
