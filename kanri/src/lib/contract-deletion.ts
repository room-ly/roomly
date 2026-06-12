// 契約・入居者・請求の削除ロジックを集約する。
//
// 背景（再発防止）:
//   contracts / rent_billings / rent_payments は FK の ON DELETE RESTRICT で繋がっており、
//   入金履歴が1件でもあると請求も契約も入居者も物理削除できないデッドロックが起きていた。
//
// 方針:
//   - 入金履歴（rent_payments）が無い「作りかけ」データ → 子から順に物理カスケード削除
//   - 入金履歴が1件でもある「使われた」データ → 論理削除（voided_at を立てる）
//     お金が動いた記録は会計・監査上、消した事実ごと残す。
//
// 実行は runManagementSql でトランザクション一括（途中失敗で全ロールバック）＋操作者付与。

import { runManagementSql } from "@/lib/management-sql";

export type DeletionScope = "contract" | "tenant";

// 削除前に依存件数を集計した結果。確認モーダルで「請求6件・入金1件が消えます」と見せる。
export interface DeletionPreview {
  billings: number; // 紐づく家賃請求の件数
  payments: number; // 紐づく入金/返金履歴の件数
  // payments>0 なら論理削除（voided）、=0 なら物理削除になる
  mode: "void" | "physical";
}

// SQLリテラルとしてのUUIDエスケープ（UUIDなので英数とハイフンのみだが念のため）
function uuid(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// 契約ID群に紐づく請求・入金の件数を数える。tenant スコープでは複数契約をまとめて渡す。
export async function previewDeletion(
  contractIds: string[],
  companyId: string,
): Promise<DeletionPreview | { error: string }> {
  if (contractIds.length === 0) {
    return { billings: 0, payments: 0, mode: "physical" };
  }
  const inList = contractIds.map(uuid).join(",");
  const sql = `
    SELECT
      (SELECT count(*) FROM rent_billings b
         WHERE b.contract_id IN (${inList}) AND b.company_id = ${uuid(companyId)}) AS billings,
      (SELECT count(*) FROM rent_payments p
         WHERE p.billing_id IN (
           SELECT id FROM rent_billings WHERE contract_id IN (${inList}) AND company_id = ${uuid(companyId)}
         )) AS payments;
  `;
  const res = await runManagementSql<{ billings: number; payments: number }>(sql, {
    actorId: null, // 参照のみ。監査ラップ不要。
  });
  if (!res.ok) return { error: res.error };
  const row = res.data[0];
  const billings = Number(row?.billings ?? 0);
  const payments = Number(row?.payments ?? 0);
  return {
    billings,
    payments,
    mode: payments > 0 ? "void" : "physical",
  };
}

// 契約（複数可）とその子を削除する。tenantId を渡すと入居者も同じ方式で処理する。
// payments があれば論理削除、無ければ物理カスケード。
export async function deleteContractsCascade(params: {
  contractIds: string[];
  tenantId?: string;
  companyId: string;
  actorId: string;
}): Promise<{ ok: true; mode: "void" | "physical" } | { ok: false; error: string }> {
  const { contractIds, tenantId, companyId, actorId } = params;
  if (contractIds.length === 0 && !tenantId) {
    return { ok: false, error: "削除対象がありません" };
  }

  const preview = await previewDeletion(contractIds, companyId);
  if ("error" in preview) return { ok: false, error: preview.error };

  const inList = contractIds.map(uuid).join(",");
  const cid = uuid(companyId);
  const tid = tenantId ? uuid(tenantId) : null;

  let body: string;

  if (preview.mode === "void") {
    // 論理削除: 契約・請求に voided_at を立てる。入金履歴は子として残す（履歴保持）。
    // 入居者は契約が voided なら一覧から消えるので、別途フラグは不要。
    const parts: string[] = [];
    if (contractIds.length > 0) {
      parts.push(`
        UPDATE rent_billings SET voided_at = now(), voided_by = ${uuid(actorId)}
          WHERE contract_id IN (${inList}) AND company_id = ${cid} AND voided_at IS NULL;`);
      parts.push(`
        UPDATE contracts SET voided_at = now(), voided_by = ${uuid(actorId)}
          WHERE id IN (${inList}) AND company_id = ${cid} AND voided_at IS NULL;`);
    }
    body = parts.join("\n");
  } else {
    // 物理削除: 子 → 親 の順。RESTRICT を回さないと弾かれる。
    // move_out_requests / rent_payments を先に消し、rent_billings → contracts → tenants。
    const parts: string[] = [];
    if (contractIds.length > 0) {
      parts.push(`
        DELETE FROM rent_payments
          WHERE billing_id IN (SELECT id FROM rent_billings WHERE contract_id IN (${inList}) AND company_id = ${cid});`);
      parts.push(`
        DELETE FROM move_out_requests WHERE contract_id IN (${inList}) AND company_id = ${cid};`);
      parts.push(`
        DELETE FROM rent_billings WHERE contract_id IN (${inList}) AND company_id = ${cid};`);
      parts.push(`
        DELETE FROM contracts WHERE id IN (${inList}) AND company_id = ${cid};`);
    }
    if (tid) {
      // 入居者に他の契約が残っていなければ削除（残っていれば RESTRICT で弾かれるので除外）
      parts.push(`
        DELETE FROM move_out_requests WHERE tenant_id = ${tid} AND company_id = ${cid};`);
      parts.push(`
        DELETE FROM tenants WHERE id = ${tid} AND company_id = ${cid}
          AND NOT EXISTS (SELECT 1 FROM contracts WHERE tenant_id = ${tid});`);
    }
    body = parts.join("\n");
  }

  const res = await runManagementSql(body, { actorId });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, mode: preview.mode };
}
