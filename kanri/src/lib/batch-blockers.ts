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
  confirmed_owners: number; // 確定済み（＝既に別の振込データに含まれている可能性がある）
  // 振込元口座
  has_sender_account: boolean;
  // 選択状態
  selected_count: number;
  selectable_count: number; // いま選べる行数（0なら選ぶものが残っていない）
}

export interface Blocker {
  // 画面に出す本文
  label: string;
  // missing: 作成を妨げる不備 / info: 補足 / pending: 操作待ち / done: この月の作業は完了
  kind?: "missing" | "info" | "pending" | "done";
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
    } else if (i.confirmed_owners > 0) {
      // 入金も確定もあるのに候補が空＝作成済みの振込データに含まれている
      blockers.push({
        kind: "info",
        label: `${month}のオーナー送金は、すでに作成済みの振込データに含まれています`,
        link_text: "下の「過去の振込バッチ」から確認・CSV出力できます",
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
    if (i.owner_rows === 0) {
      if (i.month_paid_total === 0) {
        blockers.push({
          kind: "info",
          label: `${month}の家賃入金が登録されていないため、オーナーへの送金額を計算できません`,
          href: "/rent",
          link_text: "家賃画面で入金を登録する",
        });
      } else if (i.confirmed_owners > 0) {
        blockers.push({
          kind: "info",
          label: `${month}のオーナー送金は、すでに作成済みの振込データに含まれています`,
          link_text: "下の「過去の振込バッチ」から確認・CSV出力できます",
        });
      }
    }
    // オーナーが選べない理由も「オーナーへの送金」欄の直上に表示する
    // 費用が選べない理由は「業者への費用支払い」欄の直上に表示するため、ここには出さない
    // （行から離れた場所に出すと、どの行の話か伝わらない）
  }

  // 選択されていない＝操作待ち。作成を妨げる不備がない場合のみ出す（info は妨げない）。
  const hasMissing = blockers.some((b) => b.kind !== "info" && b.kind !== "pending");
  if (!hasMissing && i.selected_count === 0) {
    if (i.selectable_count > 0) {
      blockers.push({ label: "上の一覧で振込対象にチェックを入れてください", kind: "pending" });
    } else {
      // 選べる行が残っていない＝この月の振込対象はすべて処理済み
      blockers.push({
        kind: "done",
        label: `${month}の振込対象はすべて処理済みです`,
        link_text: "新たに対象が増えたら、ここに表示されます",
      });
    }
  }

  return blockers;
}

// 作成を妨げる不備があるか（ボタンの無効化・警告表示の判定に使う）
export function hasBlockingIssue(blockers: Blocker[]): boolean {
  return blockers.some((b) => b.kind !== "info" && b.kind !== "pending" && b.kind !== "done");
}

// この月にやることが残っていないか（完了メッセージの表示判定）
export function isAllDone(blockers: Blocker[]): boolean {
  return blockers.some((b) => b.kind === "done");
}
