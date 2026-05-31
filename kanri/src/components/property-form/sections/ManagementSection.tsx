"use client";

import { Section } from "../Section";
import { Label, FieldError, type FormErrors, type EditData } from "../FormPrimitives";

export default function ManagementSection({
  editData,
  errors,
  managementForm,
  setManagementForm,
  managementFeeType,
  setManagementFeeType,
  managementFeeRate,
  setManagementFeeRate,
  managementFeeAmount,
  setManagementFeeAmount,
}: {
  editData: EditData;
  errors: FormErrors;
  managementForm: string;
  setManagementForm: (v: string) => void;
  managementFeeType: "rate" | "fixed";
  setManagementFeeType: (v: "rate" | "fixed") => void;
  managementFeeRate: string;
  setManagementFeeRate: (v: string) => void;
  managementFeeAmount: string;
  setManagementFeeAmount: (v: string) => void;
}) {
  const isSelfManaged = managementForm === "self";
  return (
    <Section title="管理・駐車場">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>管理形態</Label>
          <select
            name="management_form"
            value={managementForm}
            onChange={(e) => setManagementForm(e.target.value)}
            className="input"
          >
            <option value="">選択してください</option>
            <option value="self">自主管理</option>
            <option value="full_management">全部委託</option>
            <option value="partial_management">一部委託</option>
            <option value="sublet">サブリース</option>
          </select>
        </div>
        <div>
          <Label>管理会社</Label>
          <input
            name="management_company"
            defaultValue={editData?.management_company || ""}
            className="input"
            placeholder="例: ○○管理株式会社"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>管理手数料の方式</Label>
          <select
            value={managementFeeType}
            onChange={(e) => setManagementFeeType(e.target.value as "rate" | "fixed")}
            disabled={isSelfManaged}
            className="input"
          >
            <option value="rate">家賃の割合（%）</option>
            <option value="fixed">固定額（円）</option>
          </select>
        </div>
        <div>
          <Label>
            {managementFeeType === "rate" ? "管理手数料率（%）" : "管理手数料（円／月）"}
          </Label>
          {managementFeeType === "rate" ? (
            <input
              name="management_fee_rate"
              type="number"
              step="0.1"
              value={isSelfManaged ? "0" : managementFeeRate}
              onChange={(e) => setManagementFeeRate(e.target.value)}
              disabled={isSelfManaged}
              className="input"
              placeholder="例: 5"
            />
          ) : (
            <input
              name="management_fee_amount"
              type="number"
              step="1"
              value={isSelfManaged ? "0" : managementFeeAmount}
              onChange={(e) => setManagementFeeAmount(e.target.value)}
              disabled={isSelfManaged}
              className="input"
              placeholder="例: 5000"
            />
          )}
          {isSelfManaged ? (
            <p className="text-xs text-ink-3 mt-1">自主管理のため手数料は発生しません</p>
          ) : managementFeeType === "rate" ? (
            <FieldError errors={errors} field="management_fee_rate" />
          ) : (
            <FieldError errors={errors} field="management_fee_amount" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <Label>駐車場</Label>
          <select
            name="parking"
            defaultValue={editData?.parking || ""}
            className="input"
          >
            <option value="">選択してください</option>
            <option value="あり（平置き）">あり（平置き）</option>
            <option value="あり（機械式）">あり（機械式）</option>
            <option value="あり（立体）">あり（立体）</option>
            <option value="あり（地下）">あり（地下）</option>
            <option value="近隣確保">近隣確保</option>
            <option value="なし">なし</option>
          </select>
        </div>
        <div>
          <Label>駐車場月額（円）</Label>
          <input
            name="parking_fee"
            type="number"
            defaultValue={editData?.parking_fee || ""}
            className="input"
            placeholder="例: 20000"
          />
        </div>
        <div>
          <Label>駐輪場</Label>
          <select
            name="bicycle_parking"
            defaultValue={editData?.bicycle_parking || ""}
            className="input"
          >
            <option value="">選択してください</option>
            <option value="あり（無料）">あり（無料）</option>
            <option value="あり（有料）">あり（有料）</option>
            <option value="なし">なし</option>
          </select>
        </div>
      </div>

      <div>
        <Label>バイク置場</Label>
        <select
          name="bike_parking"
          defaultValue={editData?.bike_parking || ""}
          className="input max-w-xs"
        >
          <option value="">選択してください</option>
          <option value="あり(無料)">あり（無料）</option>
          <option value="あり(有料)">あり（有料）</option>
          <option value="なし">なし</option>
        </select>
      </div>
    </Section>
  );
}
