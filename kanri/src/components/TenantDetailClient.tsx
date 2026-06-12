"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import TenantFormModal from "./TenantFormModal";
import { usePermission } from "@/lib/use-permission";
import { useConfirm, useNotify } from "@/lib/confirm-context";

interface TenantDetailClientProps {
  tenant: Record<string, any>;
}

export default function TenantDetailClient({ tenant }: TenantDetailClientProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [modalOpen, setModalOpen] = useState(false);
  const canEdit = usePermission("tenants:edit");
  const canDelete = usePermission("tenants:delete");

  async function handleDelete() {
    // 紐づく契約・請求・入金の件数を取得して確認文面に反映する
    let message = "";
    try {
      const pres = await fetch(`/api/tenants/${tenant.id}?preview=1`);
      if (pres.ok) {
        const p = (await pres.json()) as { billings: number; payments: number; contracts: number; mode: "void" | "physical" };
        if (p.mode === "void") {
          message = `この入居者には契約${p.contracts}件・請求${p.billings}件・入金/返金履歴${p.payments}件が紐づきます。お金の記録のため「取り消し済み」として一覧から非表示にします（履歴はデータベースに残ります）。`;
        } else if (p.contracts > 0) {
          message = `この入居者と紐づく契約${p.contracts}件・家賃請求${p.billings}件を完全に削除します。入金履歴はないため復元できません。`;
        } else {
          message = "この入居者を削除します。復元できません。";
        }
      }
    } catch {
      /* プレビュー取得失敗時はデフォルト文面のまま進める */
    }
    if (!(await confirm({ title: `「${tenant.name}」を削除しますか？`, message, variant: "danger", confirmLabel: "削除する" }))) return;
    const res = await fetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
    if (res.ok) router.push("/tenants");
    else notify({ title: "削除に失敗しました" });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-secondary flex items-center gap-1.5 text-[13px]"
          >
            <Pencil size={13} />
            編集
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <TenantFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={tenant}
      />
    </>
  );
}
