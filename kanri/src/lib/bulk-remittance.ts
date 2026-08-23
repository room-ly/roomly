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

// 未確定候補が0件のとき、なぜ「送金一括生成」の対象がないのかを説明する。
// 「ボタンが見つからない」という問い合わせを防ぐため、原因と次の操作を必ず提示する。
export interface EmptyReasonInput {
  registered_owners: number;
  owners_without_net: number;
  confirmed_owners: number;
  month_paid_total: number;
}

export function describeNoCandidates(
  s: EmptyReasonInput,
  month: string
): { title: string; hint: string } {
  // オーナー未登録：そもそも送金対象が存在しない
  if (s.registered_owners === 0) {
    return {
      title: "オーナーが登録されていません",
      hint: "「オーナー」画面でオーナーを登録し、物件と紐付けてください。",
    };
  }
  // 全員確定済み：作業完了
  if (s.confirmed_owners > 0 && s.owners_without_net === 0) {
    return {
      title: `${month}の精算はすべて確定済みです`,
      hint: "下の「オーナーへの送金」から振込対象を選んでバッチを作成できます。",
    };
  }
  // 当月入金ゼロ：最も多いケース。送金額は実入金ベースで計算されるため候補が出ない
  if (s.month_paid_total === 0) {
    return {
      title: `${month}の家賃入金が登録されていません`,
      hint: "オーナー送金額は実際に入金された家賃をもとに計算します。「家賃」画面で対象月の入金を登録すると、ここに対象オーナーが表示されます。",
    };
  }
  // 入金はあるが全オーナーの精算額が0円以下
  if (s.owners_without_net > 0) {
    return {
      title: `${month}は送金対象のオーナーがいません`,
      hint: "入金済みの家賃より管理手数料・経費の差引額が大きいため、送金額が0円以下になっています。「家賃」画面の入金状況と経費をご確認ください。",
    };
  }
  return {
    title: `${month}は送金対象のオーナーがいません`,
    hint: "「家賃」画面で対象月の入金状況をご確認ください。",
  };
}
