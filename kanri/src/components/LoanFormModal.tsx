"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";

interface SelectItem {
  id: string;
  label: string;
  owner_id?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, any> | null;
  properties: SelectItem[];
  owners: SelectItem[];
}

export default function LoanFormModal({ isOpen, onClose, editData, properties, owners }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [ratios, setRatios] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLFormElement>(null);
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const target = editData?.id ?? "__new__";
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;

    setOwnerId(editData?.owner_id || "");
    const links = (editData?.loan_properties ?? []) as Record<string, any>[];
    setSelectedProps(links.map((l) => l.property?.id).filter(Boolean));
    const r: Record<string, string> = {};
    for (const l of links) {
      if (l.property?.id && l.allocation_ratio != null) r[l.property.id] = String(l.allocation_ratio);
    }
    setRatios(r);
    setApiError("");
    formRef.current?.reset();
  }, [isOpen, editData]);

  const isEdit = !!editData;

  // オーナーを選ぶとそのオーナーの物件だけに絞る。未選択（自社借入）なら全物件。
  const visibleProperties = ownerId
    ? properties.filter((p) => p.owner_id === ownerId)
    : properties;

  // オーナー変更時、表示対象外になった選択物件を外す
  function handleOwnerChange(newOwnerId: string) {
    setOwnerId(newOwnerId);
    if (newOwnerId) {
      const allowed = new Set(properties.filter((p) => p.owner_id === newOwnerId).map((p) => p.id));
      setSelectedProps((prev) => prev.filter((id) => allowed.has(id)));
    }
  }

  function toggleProperty(id: string) {
    setSelectedProps((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => { data[key] = value; });

    if (!data.name || !data.lender_name || !data.principal_amount) {
      setApiError("ローン名・借入先・借入元本は必須です");
      return;
    }

    data.property_ids = selectedProps;
    const allocation_ratios: Record<string, number> = {};
    for (const pid of selectedProps) {
      if (ratios[pid]) allocation_ratios[pid] = Number(ratios[pid]);
    }
    data.allocation_ratios = allocation_ratios;

    setLoading(true);
    try {
      const url = isEdit ? `/api/loans/${editData!.id}` : "/api/loans";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setApiError(err.error || "エラーが発生しました");
        return;
      }
      lastTargetRef.current = null;
      formRef.current?.reset();
      onClose();
      router.refresh();
      dispatchAuditLogRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ display: isOpen ? "flex" : "none" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">{isEdit ? "ローンを編集" : "ローンを追加"}</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{apiError}</div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* 借入オーナー: 最初に決める。地主管理の人は自分を選ぶ。
              選ぶとそのオーナーの物件だけが下の対象物件に出る */}
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">借入オーナー</label>
            <select
              name="owner_id"
              value={ownerId}
              onChange={(e) => handleOwnerChange(e.target.value)}
              className="input"
            >
              <option value="">指定しない（自社借入）</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-ink-3 mt-1">
              オーナーを選ぶと、そのオーナーの物件だけが下の「対象物件」に表示されます。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-ink-2 block mb-1">
                ローン名 <span className="text-danger">*</span>
              </label>
              <input name="name" defaultValue={editData?.name || ""} className="input" placeholder="例: 〇〇マンション アパートローン" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                借入先金融機関 <span className="text-danger">*</span>
              </label>
              <input name="lender_name" defaultValue={editData?.lender_name || ""} className="input" placeholder="例: 〇〇銀行" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">証書番号・お客様番号</label>
              <input name="loan_number" defaultValue={editData?.loan_number || ""} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                借入元本（円） <span className="text-danger">*</span>
              </label>
              <input name="principal_amount" type="number" min={1} defaultValue={editData?.principal_amount ?? ""} className="input" placeholder="例: 30000000" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">金利（年率%）</label>
              <input name="interest_rate" type="number" step="0.001" min={0} defaultValue={editData?.interest_rate ?? ""} className="input" placeholder="例: 1.875" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">金利タイプ</label>
              <select name="interest_type" defaultValue={editData?.interest_type || "fixed"} className="input">
                <option value="fixed">固定金利</option>
                <option value="variable">変動金利</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">返済方式</label>
              <select name="repayment_method" defaultValue={editData?.repayment_method || "equal_principal_and_interest"} className="input">
                <option value="equal_principal_and_interest">元利均等</option>
                <option value="equal_principal">元金均等</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">返済期間（月数）</label>
              <input name="term_months" type="number" min={1} defaultValue={editData?.term_months ?? ""} className="input" placeholder="例: 360（30年）" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">毎月の返済日</label>
              <input name="payment_day" type="number" min={1} max={31} defaultValue={editData?.payment_day ?? ""} className="input" placeholder="例: 27" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">実行日（借入日）</label>
              <input name="disbursement_date" type="date" defaultValue={editData?.disbursement_date || ""} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">初回返済日</label>
              <input name="first_payment_date" type="date" defaultValue={editData?.first_payment_date || ""} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">状態</label>
              <select name="status" defaultValue={editData?.status || "active"} className="input">
                <option value="active">返済中</option>
                <option value="completed">完済</option>
                <option value="refinanced">借換</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">引落口座（メモ）</label>
              <input name="bank_account_label" defaultValue={editData?.bank_account_label || ""} className="input" placeholder="例: 〇〇銀行 普通 1234567" />
            </div>
          </div>

          {/* 対象物件（多対多。通常は1物件、共同担保・複数棟一括ローンは複数選択） */}
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">対象物件</label>
            <p className="text-xs text-ink-3 mb-2">通常は1物件を選択。共同担保・複数棟一括ローンの場合のみ複数選択（按分比率%は任意）。</p>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {visibleProperties.length === 0 ? (
                <div className="p-3 text-sm text-ink-3">
                  {ownerId ? "このオーナーの物件が登録されていません" : "物件が登録されていません"}
                </div>
              ) : (
                visibleProperties.map((p) => {
                  const checked = selectedProps.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-surface-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleProperty(p.id)} />
                      <span className="flex-1">{p.label}</span>
                      {checked && (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={ratios[p.id] ?? ""}
                          onChange={(e) => setRatios((r) => ({ ...r, [p.id]: e.target.value }))}
                          placeholder="按分%"
                          className="input w-24 py-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">メモ</label>
            <textarea name="notes" defaultValue={editData?.notes || ""} className="input" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">キャンセル</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:cursor-wait">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "保存中…" : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
