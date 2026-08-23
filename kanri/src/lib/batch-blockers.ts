// 「振込データを作成」が押せないとき、何が足りないのかを判定する。
// 利用者は最後に押せないボタンを見るので、原因と次の操作をボタンの近くに集約する。

export interface BlockerInput {
  // オーナー送金の候補（確定済み＋未確定）
  owner_rows: number;           // 一覧に出ているオーナー行数
  owners_without_bank: string[]; // 口座情報が未登録のオーナー名
  // 業者への費用支払い
  expense_rows: number;
  expenses_without_payee: number;    // 支払先そのものが未設定の費用件数
  expenses_payee_no_bank: number;    // 支払先はあるが口座情報が足りない費用件数
  // 送金額が出ない理由（オーナー行が0のとき）
  month_paid_total: number;
  registered_owners: number;
  // 振込元口座
  has_sender_account: boolean;
  // 選択状態
  selected_count: number;
}

export interface Blocker {
  // 画面に出す本文
  label: string;
  // 未選択のような「操作待ち」は不備ではないので警告として扱わない
  kind?: "missing" | "pending";
  // 誘導先。同一画面内で解決する場合は href を持たない
  href?: string;
  link_text?: string;
}

// 振込データを作成するために足りないものを列挙する。
// 空配列＝作成可能。
export function detectBlockers(i: BlockerInput, month: string): Blocker[] {
  const blockers: Blocker[] = [];

  // 振込元口座は全体の前提なので最初に出す
  if (!i.has_sender_account) {
    blockers.push({
      label: "振込元口座が登録されていません",
      href: "/settings",
      link_text: "設定画面で振込元口座を登録する",
    });
  }

  // 振込対象そのものが1件もない場合、その原因を出す
  if (i.owner_rows === 0 && i.expense_rows === 0) {
    if (i.registered_owners === 0) {
      blockers.push({
        label: "オーナーが登録されていません",
        href: "/owners",
        link_text: "オーナー画面で登録する",
      });
    } else if (i.month_paid_total === 0) {
      blockers.push({
        label: `${month}の家賃入金が登録されていないため、オーナーへの送金額を計算できません`,
        href: "/rent",
        link_text: "家賃画面で入金を登録する",
      });
    } else {
      blockers.push({
        label: `${month}は送金額が0円以下のオーナーのみです（管理手数料・経費の差引が入金額を上回っています）`,
        href: "/rent",
        link_text: "家賃画面で入金状況を確認する",
      });
    }
  } else {
    // 対象はあるが、選べない・選んでいないケース
    if (i.owner_rows === 0 && i.month_paid_total === 0) {
      blockers.push({
        label: `${month}の家賃入金が登録されていないため、オーナーへの送金額を計算できません`,
        href: "/rent",
        link_text: "家賃画面で入金を登録する",
      });
    }
    if (i.owners_without_bank.length > 0) {
      blockers.push({
        label: `口座情報が未登録のオーナーがいます（${i.owners_without_bank.join("、")}）`,
        href: "/owners",
        link_text: "オーナー画面で口座情報を登録する",
      });
    }
    if (i.expenses_without_payee > 0) {
      blockers.push({
        label: `支払先が未設定の費用が${i.expenses_without_payee}件あります`,
        link_text: "この画面の「業者への費用支払い」で設定できます",
      });
    }
    // 支払先は選ばれているが口座情報が足りないケースは、支払先マスタ側の修正が必要
    if (i.expenses_payee_no_bank > 0) {
      blockers.push({
        label: `支払先の口座情報が未登録の費用が${i.expenses_payee_no_bank}件あります`,
        href: "/payees",
        link_text: "支払先画面で口座情報を登録する",
      });
    }
  }

  // 選択されていない＝操作待ち。上記の不足がない場合のみ出す。
  if (blockers.length === 0 && i.selected_count === 0) {
    blockers.push({ label: "上の一覧で振込対象にチェックを入れてください", kind: "pending" });
  }

  return blockers;
}
