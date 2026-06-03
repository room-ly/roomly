"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { propertySchema, type PropertyFormData } from "@/lib/schemas";
import { toWareki } from "@/lib/wareki";
import PropertyImages from "./PropertyImages";
import UnitTable from "./UnitTable";
import type { ZodError } from "zod";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";
import BasicSection from "./property-form/sections/BasicSection";
import AddressSection from "./property-form/sections/AddressSection";
import StationSection from "./property-form/sections/StationSection";
import BuildingSection from "./property-form/sections/BuildingSection";
import ManagementSection from "./property-form/sections/ManagementSection";
import FacilitiesSection from "./property-form/sections/FacilitiesSection";
import ZoningSection from "./property-form/sections/ZoningSection";
import RegistrySection from "./property-form/sections/RegistrySection";
import InfraSection from "./property-form/sections/InfraSection";
import RiskSection from "./property-form/sections/RiskSection";
import RemarksSection from "./property-form/sections/RemarksSection";

interface Owner {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  label: string;
  role?: string;
}

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: Owner[];
  users?: UserOption[];
  editData?: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  // 編集時に画像・部屋一覧セクションを表示するために親から渡す（新規作成時は省略）
  units?: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  contracts?: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function PropertyFormModal({
  isOpen,
  onClose,
  owners,
  users = [],
  editData,
  units,
  contracts,
}: PropertyFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [builtYearWareki, setBuiltYearWareki] = useState(() => {
    const y = editData?.built_year ?? new Date().getFullYear();
    return y ? toWareki(y) : "";
  });
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    () => editData?.common_facilities || []
  );
  const [address, setAddress] = useState(editData?.address || "");
  const [managementForm, setManagementForm] = useState(editData?.management_form || "");
  const [managementFeeType, setManagementFeeType] = useState<"rate" | "fixed">(
    (editData?.management_fee_type as "rate" | "fixed") || "rate"
  );
  const [managementFeeRate, setManagementFeeRate] = useState(
    String(editData?.management_fee_rate ?? "5")
  );
  const [managementFeeAmount, setManagementFeeAmount] = useState(
    String(editData?.management_fee_amount ?? "")
  );
  const isSelfManaged = managementForm === "self";

  const formRef = useRef<HTMLFormElement>(null);
  // 編集対象が切り替わった時のみフォーム状態をリセット。
  // 同じ対象の閉じ直しでは入力を保持して、誤クローズで内容を失わないようにする。
  const lastTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const target = editData?.id ?? "__new__";
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;

    const y = editData?.built_year ?? new Date().getFullYear();
    setBuiltYearWareki(y ? toWareki(y) : "");
    setSelectedFacilities(editData?.common_facilities || []);
    setAddress(editData?.address || "");
    setManagementForm(editData?.management_form || "");
    setManagementFeeType((editData?.management_fee_type as "rate" | "fixed") || "rate");
    setManagementFeeRate(String(editData?.management_fee_rate ?? "5"));
    setManagementFeeAmount(String(editData?.management_fee_amount ?? ""));
    setErrors({});
    setApiError("");
    formRef.current?.reset();
  }, [isOpen, editData]);

  const isEdit = !!editData;

  function toggleFacility(f: string) {
    setSelectedFacilities((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    formData.forEach((value, key) => {
      data[key] = value;
    });
    data.common_facilities = selectedFacilities;
    // 自主管理時は手数料が発生しないため率・固定額ともに0で保存（入力はdisabledでFormDataに含まれない）
    if (isSelfManaged) {
      data.management_fee_type = "rate";
      data.management_fee_rate = 0;
      data.management_fee_amount = 0;
    } else {
      // 選択されていない方式の値は0にする（残骸を残さない）
      data.management_fee_type = managementFeeType;
      if (managementFeeType === "rate") {
        data.management_fee_amount = 0;
      } else {
        data.management_fee_rate = 0;
      }
    }

    try {
      const parsed = propertySchema.parse(data) as PropertyFormData;
      setLoading(true);

      const url = isEdit
        ? `/api/properties/${editData!.id}`
        : "/api/properties";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.details) {
          setErrors(err.details as Record<string, string[]>);
          setApiError("入力内容を確認してください");
        } else {
          setApiError(err.error || "エラーが発生しました");
        }
        return;
      }

      // 送信成功時は次回オープン時に必ず再初期化されるよう、対象記録をリセット
      lastTargetRef.current = null;
      onClose();
      router.refresh();
      dispatchAuditLogRefresh();
    } catch (err) {
      const zodErr = err as ZodError;
      if (zodErr.flatten) {
        setErrors(zodErr.flatten().fieldErrors as Record<string, string[]>);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
        isOpen ? "" : "hidden"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 pb-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">
            {isEdit ? "物件を編集" : "物件を追加"}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {apiError}
          </div>
        )}

        {isEdit && editData && (
          <div className="mb-4">
            <p className="text-[13px] font-medium text-ink-2 mb-2">物件画像</p>
            <PropertyImages propertyId={editData.id} enabled={isOpen} />
          </div>
        )}

        {isEdit && editData && units && contracts && (
          <div className="mb-4">
            <UnitTable
              propertyId={editData.id}
              propertyType={editData.property_type}
              units={units}
              contracts={contracts}
              showAddButton
            />
          </div>
        )}

        <form
          ref={formRef}
          key={editData?.id ?? "__new__"}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <BasicSection editData={editData} errors={errors} owners={owners} users={users} />
          <AddressSection
            editData={editData}
            errors={errors}
            address={address}
            setAddress={setAddress}
          />
          <StationSection editData={editData} />
          <BuildingSection
            editData={editData}
            errors={errors}
            builtYearWareki={builtYearWareki}
            setBuiltYearWareki={setBuiltYearWareki}
          />
          <ManagementSection
            editData={editData}
            errors={errors}
            managementForm={managementForm}
            setManagementForm={setManagementForm}
            managementFeeType={managementFeeType}
            setManagementFeeType={setManagementFeeType}
            managementFeeRate={managementFeeRate}
            setManagementFeeRate={setManagementFeeRate}
            managementFeeAmount={managementFeeAmount}
            setManagementFeeAmount={setManagementFeeAmount}
          />
          <FacilitiesSection
            selectedFacilities={selectedFacilities}
            toggleFacility={toggleFacility}
          />
          <ZoningSection editData={editData} />
          <RegistrySection editData={editData} />
          <InfraSection editData={editData} />
          <RiskSection editData={editData} />
          <RemarksSection editData={editData} />

          <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-surface border-t border-line flex justify-end gap-2 z-10">
            <button
              type="button"
              onClick={onClose}
              className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
