"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { propertySchema, type PropertyFormData } from "@/lib/schemas";
import { toWareki } from "@/lib/wareki";
import PostalCodeInput from "./PostalCodeInput";
import StationInput from "./StationInput";
import PropertyImages from "./PropertyImages";
import UnitTable from "./UnitTable";
import type { ZodError } from "zod";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";

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
  editData?: Record<string, any> | null;
  // 編集時に画像・部屋一覧セクションを表示するために親から渡す（新規作成時は省略）
  units?: Record<string, any>[];
  contracts?: Record<string, any>[];
}

const COMMON_FACILITIES = [
  "オートロック",
  "宅配ボックス",
  "エレベーター",
  "防犯カメラ",
  "ゴミ置場",
  "駐輪場",
  "バイク置場",
  "敷地内ゴミ置場",
  "管理人常駐",
  "管理人日勤",
  "コンシェルジュ",
  "ラウンジ",
  "ゲストルーム",
  "キッズルーム",
  "フィットネス",
  "屋上テラス",
  "トランクルーム",
  "24時間セキュリティ",
  "耐震構造",
  "免震構造",
];

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-2 text-[13px] font-medium text-ink-2 hover:bg-bg-2/80 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-ink-2 block mb-1">
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  if (!errors[field]) return null;
  return <p className="text-danger text-sm mt-1">{errors[field][0]}</p>;
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
    // 編集時は既存値、新規作成時は今年をデフォルトにして和暦も初期表示
    const y = editData?.built_year ?? new Date().getFullYear();
    return y ? toWareki(y) : "";
  });
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    () => editData?.common_facilities || []
  );
  // 郵便番号補完で書き換わる住所フィールド（制御コンポーネント化）
  const [address, setAddress] = useState(editData?.address || "");
  // 自主管理は管理会社への委託手数料が発生しないため、手数料率を無効化する
  const [managementForm, setManagementForm] = useState(editData?.management_form || "");
  // 管理手数料の方式（率 or 固定額）と各値
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
  // 編集対象が切り替わった時のみフォーム状態をリセットする。
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
    const data: Record<string, any> = {};
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

        {/* 編集時のみ：画像セクション（モーダル内で直接アップロード可能） */}
        {isEdit && editData && (
          <div className="mb-4">
            <p className="text-[13px] font-medium text-ink-2 mb-2">物件画像</p>
            <PropertyImages propertyId={editData.id} />
          </div>
        )}

        {/* 編集時のみ：部屋一覧＋追加ボタン */}
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
          {/* 基本情報（常に開いた状態） */}
          <Section title="基本情報" defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>物件名</Label>
                <input
                  name="name"
                  defaultValue={editData?.name || ""}
                  className="input"
                  placeholder="例: サンシャインマンション"
                />
                <FieldError errors={errors} field="name" />
              </div>
              <div>
                <Label>物件名（カナ）</Label>
                <input
                  name="name_kana"
                  defaultValue={editData?.name_kana || ""}
                  className="input"
                  placeholder="例: サンシャインマンション"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>物件種別</Label>
                <select
                  name="property_type"
                  defaultValue={editData?.property_type || "apartment"}
                  className="input"
                >
                  <option value="apartment">マンション</option>
                  <option value="apart">アパート</option>
                  <option value="house">戸建て</option>
                  <option value="parking">駐車場</option>
                  <option value="land">土地</option>
                  <option value="commercial">商業</option>
                </select>
                <FieldError errors={errors} field="property_type" />
              </div>
              <div>
                <Label>物件コード</Label>
                <input
                  name="property_code"
                  defaultValue={editData?.property_code || ""}
                  className="input"
                  placeholder="例: BLD-001"
                />
              </div>
            </div>

            <div>
              <Label>オーナー</Label>
              <select
                name="owner_id"
                defaultValue={editData?.owner_id || ""}
                className="input"
              >
                <option value="">選択してください</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>経費承認者</Label>
              <select
                name="approver_user_id"
                defaultValue={editData?.approver_user_id || ""}
                className="input"
              >
                <option value="">会社のデフォルト承認者を使う</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink-3 mt-1">
                この物件の経費が承認待ちになった際にボタンが出る人を指定します。未指定なら会社設定の「デフォルト承認者」が使われます。
              </p>
            </div>
          </Section>

          {/* 所在地 */}
          <Section title="所在地" defaultOpen>
            <div>
              <Label>郵便番号</Label>
              <PostalCodeInput
                defaultValue={editData?.postal_code || ""}
                onResolved={(r) => setAddress(r.address)}
              />
            </div>

            <div>
              <Label required>住所</Label>
              <input
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder="例: 東京都新宿区西新宿1-1-1"
              />
              <FieldError errors={errors} field="address" />
            </div>

            <div>
              <Label>建物番号</Label>
              <input
                name="building_number"
                defaultValue={editData?.building_number || ""}
                className="input"
                placeholder="例: 1-1-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>緯度</Label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={editData?.latitude || ""}
                  className="input"
                  placeholder="例: 35.6895"
                />
              </div>
              <div>
                <Label>経度</Label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={editData?.longitude || ""}
                  className="input"
                  placeholder="例: 139.6917"
                />
              </div>
            </div>
          </Section>

          {/* 交通 */}
          <Section title="交通">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>最寄り駅①</Label>
                <StationInput
                  name="nearest_station"
                  idName="nearest_station_id"
                  defaultValue={editData?.nearest_station || ""}
                  defaultId={editData?.nearest_station_id || ""}
                />
              </div>
              <div>
                <Label>徒歩（分）</Label>
                <input
                  name="walk_minutes"
                  type="number"
                  defaultValue={editData?.walk_minutes || ""}
                  className="input"
                  placeholder="例: 5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>最寄り駅②</Label>
                <StationInput
                  name="nearest_station_2"
                  idName="nearest_station_2_id"
                  defaultValue={editData?.nearest_station_2 || ""}
                  defaultId={editData?.nearest_station_2_id || ""}
                />
              </div>
              <div>
                <Label>徒歩（分）</Label>
                <input
                  name="walk_minutes_2"
                  type="number"
                  defaultValue={editData?.walk_minutes_2 || ""}
                  className="input"
                  placeholder="例: 8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>最寄り駅③</Label>
                <StationInput
                  name="nearest_station_3"
                  idName="nearest_station_3_id"
                  defaultValue={editData?.nearest_station_3 || ""}
                  defaultId={editData?.nearest_station_3_id || ""}
                />
              </div>
              <div>
                <Label>徒歩（分）</Label>
                <input
                  name="walk_minutes_3"
                  type="number"
                  defaultValue={editData?.walk_minutes_3 || ""}
                  className="input"
                  placeholder="例: 3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>バス停</Label>
                <input
                  name="bus_station"
                  defaultValue={editData?.bus_station || ""}
                  className="input"
                  placeholder="例: 西新宿バス停"
                />
              </div>
              <div>
                <Label>バス（分）</Label>
                <input
                  name="bus_minutes"
                  type="number"
                  defaultValue={editData?.bus_minutes || ""}
                  className="input"
                  placeholder="例: 10"
                />
              </div>
            </div>
          </Section>

          {/* 建物 */}
          <Section title="建物">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>構造</Label>
                <select
                  name="structure"
                  defaultValue={editData?.structure || ""}
                  className="input"
                >
                  <option value="">選択してください</option>
                  <option value="RC">RC（鉄筋コンクリート）</option>
                  <option value="SRC">SRC（鉄骨鉄筋コンクリート）</option>
                  <option value="S">S（鉄骨）</option>
                  <option value="木造">木造</option>
                  <option value="軽量鉄骨">軽量鉄骨</option>
                  <option value="ブロック">ブロック</option>
                  <option value="PC">PC（プレキャストコンクリート）</option>
                  <option value="HPC">HPC（鉄骨プレキャスト）</option>
                  <option value="ALC">ALC</option>
                </select>
              </div>
              <div>
                <Label>地上階数</Label>
                <input
                  name="floors"
                  type="number"
                  defaultValue={editData?.floors || ""}
                  className="input"
                  placeholder="例: 10"
                />
                <FieldError errors={errors} field="floors" />
              </div>
              <div>
                <Label>地下階数</Label>
                <input
                  name="underground_floors"
                  type="number"
                  defaultValue={editData?.underground_floors || ""}
                  className="input"
                  placeholder="例: 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>築年</Label>
                <input
                  name="built_year"
                  type="number"
                  defaultValue={editData?.built_year || new Date().getFullYear()}
                  className="input"
                  placeholder="例: 2020"
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setBuiltYearWareki(y >= 1868 ? toWareki(y) : "");
                  }}
                />
                {builtYearWareki && (
                  <p className="text-ink-3 text-xs mt-1">{builtYearWareki}</p>
                )}
                <FieldError errors={errors} field="built_year" />
              </div>
              <div>
                <Label>築月</Label>
                <select
                  name="built_month"
                  defaultValue={editData?.built_month || ""}
                  className="input"
                >
                  <option value="">-</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>改築年</Label>
                <input
                  name="renovation_year"
                  type="number"
                  defaultValue={editData?.renovation_year || ""}
                  className="input"
                  placeholder="例: 2023"
                />
              </div>
              <div>
                <Label>改築月</Label>
                <select
                  name="renovation_month"
                  defaultValue={editData?.renovation_month || ""}
                  className="input"
                >
                  <option value="">-</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>延床面積（㎡）</Label>
                <input
                  name="total_area_sqm"
                  type="number"
                  step="0.01"
                  defaultValue={editData?.total_area_sqm || ""}
                  className="input"
                  placeholder="例: 1500.00"
                />
              </div>
              <div>
                <Label>建築面積（㎡）</Label>
                <input
                  name="building_area_sqm"
                  type="number"
                  step="0.01"
                  defaultValue={editData?.building_area_sqm || ""}
                  className="input"
                  placeholder="例: 300.00"
                />
              </div>
              <div>
                <Label>敷地面積（㎡）</Label>
                <input
                  name="land_area_sqm"
                  type="number"
                  step="0.01"
                  defaultValue={editData?.land_area_sqm || ""}
                  className="input"
                  placeholder="例: 500.00"
                />
              </div>
            </div>
          </Section>

          {/* 管理・駐車場 */}
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

            {/* 管理手数料: 率（%）or 固定額（円）を選択 */}
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
                    // 自主管理時は委託手数料が発生しないため0固定・編集不可
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
                <option value="あり（無料）">あり（無料）</option>
                <option value="あり（有料）">あり（有料）</option>
                <option value="なし">なし</option>
              </select>
            </div>
          </Section>

          {/* 共用設備 */}
          <Section title="共用設備">
            <div className="flex flex-wrap gap-2">
              {COMMON_FACILITIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFacility(f)}
                  className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                    selectedFacilities.includes(f)
                      ? "bg-accent text-white border-accent"
                      : "bg-bg-2 text-ink-2 border-line hover:border-ink-3"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Section>

          {/* 用途地域・法規 */}
          <Section title="用途地域・法規">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>用途地域</Label>
                <select
                  name="land_use_zone"
                  defaultValue={editData?.land_use_zone || ""}
                  className="input"
                >
                  <option value="">選択してください</option>
                  <option value="第一種低層住居専用地域">第一種低層住居専用地域</option>
                  <option value="第二種低層住居専用地域">第二種低層住居専用地域</option>
                  <option value="第一種中高層住居専用地域">第一種中高層住居専用地域</option>
                  <option value="第二種中高層住居専用地域">第二種中高層住居専用地域</option>
                  <option value="第一種住居地域">第一種住居地域</option>
                  <option value="第二種住居地域">第二種住居地域</option>
                  <option value="準住居地域">準住居地域</option>
                  <option value="田園住居地域">田園住居地域</option>
                  <option value="近隣商業地域">近隣商業地域</option>
                  <option value="商業地域">商業地域</option>
                  <option value="準工業地域">準工業地域</option>
                  <option value="工業地域">工業地域</option>
                  <option value="工業専用地域">工業専用地域</option>
                </select>
              </div>
              <div>
                <Label>土地権利</Label>
                <select
                  name="land_rights"
                  defaultValue={editData?.land_rights || ""}
                  className="input"
                >
                  <option value="">選択してください</option>
                  <option value="ownership">所有権</option>
                  <option value="leasehold">借地権</option>
                  <option value="sublease">転借地権</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>建ぺい率（%）</Label>
                <input
                  name="building_coverage_ratio"
                  type="number"
                  step="0.01"
                  defaultValue={editData?.building_coverage_ratio || ""}
                  className="input"
                  placeholder="例: 60"
                />
              </div>
              <div>
                <Label>容積率（%）</Label>
                <input
                  name="floor_area_ratio"
                  type="number"
                  step="0.01"
                  defaultValue={editData?.floor_area_ratio || ""}
                  className="input"
                  placeholder="例: 200"
                />
              </div>
              <div>
                <Label>地目</Label>
                <input
                  name="zoning"
                  defaultValue={editData?.zoning || ""}
                  className="input"
                  placeholder="例: 宅地"
                />
              </div>
            </div>
          </Section>

          {/* 登記情報 */}
          <Section title="登記情報">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>登記名義人</Label>
                <input
                  name="registered_owner_name"
                  defaultValue={editData?.registered_owner_name || ""}
                  className="input"
                  placeholder="例: 山田太郎"
                />
              </div>
              <div>
                <Label>抵当権</Label>
                <select
                  name="mortgage_exists"
                  defaultValue={editData?.mortgage_exists ? "true" : "false"}
                  className="input"
                >
                  <option value="false">なし</option>
                  <option value="true">あり</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>抵当権者</Label>
                <input
                  name="mortgagee"
                  defaultValue={editData?.mortgagee || ""}
                  className="input"
                  placeholder="例: ○○銀行"
                />
              </div>
              <div>
                <Label>抵当権額（円）</Label>
                <input
                  name="mortgage_amount"
                  type="number"
                  defaultValue={editData?.mortgage_amount || ""}
                  className="input"
                  placeholder="例: 50000000"
                />
              </div>
            </div>
          </Section>

          {/* インフラ */}
          <Section title="インフラ">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>水道</Label>
                <select
                  name="water_supply"
                  defaultValue={editData?.water_supply || ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  <option value="公営水道">公営水道</option>
                  <option value="私設水道">私設水道</option>
                  <option value="井戸">井戸</option>
                </select>
              </div>
              <div>
                <Label>ガス</Label>
                <select
                  name="gas_type"
                  defaultValue={editData?.gas_type || ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  <option value="都市ガス">都市ガス</option>
                  <option value="プロパンガス">プロパンガス</option>
                  <option value="オール電化">オール電化</option>
                </select>
              </div>
              <div>
                <Label>電気</Label>
                <select
                  name="electricity"
                  defaultValue={editData?.electricity || ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  <option value="東京電力">東京電力</option>
                  <option value="関西電力">関西電力</option>
                  <option value="中部電力">中部電力</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>排水</Label>
                <select
                  name="sewage"
                  defaultValue={editData?.sewage || ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  <option value="公共下水">公共下水</option>
                  <option value="個別浄化槽">個別浄化槽</option>
                  <option value="集中浄化槽">集中浄化槽</option>
                  <option value="汲み取り">汲み取り</option>
                </select>
              </div>
              <div>
                <Label>浄化槽</Label>
                <select
                  name="septic_tank"
                  defaultValue={editData?.septic_tank ? "true" : "false"}
                  className="input"
                >
                  <option value="false">なし</option>
                  <option value="true">あり</option>
                </select>
              </div>
            </div>
          </Section>

          {/* リスク調査 */}
          <Section title="リスク調査">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>石綿（アスベスト）調査</Label>
                <select
                  name="asbestos_survey"
                  defaultValue={editData?.asbestos_survey || ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  <option value="調査済み（使用なし）">調査済み（使用なし）</option>
                  <option value="調査済み（使用あり）">調査済み（使用あり）</option>
                  <option value="未調査">未調査</option>
                </select>
              </div>
              <div>
                <Label>耐震診断</Label>
                <select
                  name="earthquake_resistance"
                  defaultValue={editData?.earthquake_resistance || ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  <option value="新耐震基準適合">新耐震基準適合</option>
                  <option value="耐震診断済み（適合）">耐震診断済み（適合）</option>
                  <option value="耐震診断済み（不適合）">耐震診断済み（不適合）</option>
                  <option value="未診断">未診断</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>洪水ハザード</Label>
                <select
                  name="flood_hazard_zone"
                  defaultValue={editData?.flood_hazard_zone ? "true" : "false"}
                  className="input"
                >
                  <option value="false">区域外</option>
                  <option value="true">区域内</option>
                </select>
              </div>
              <div>
                <Label>土砂災害ハザード</Label>
                <select
                  name="landslide_hazard_zone"
                  defaultValue={editData?.landslide_hazard_zone ? "true" : "false"}
                  className="input"
                >
                  <option value="false">区域外</option>
                  <option value="true">区域内</option>
                </select>
              </div>
              <div>
                <Label>津波ハザード</Label>
                <select
                  name="tsunami_hazard_zone"
                  defaultValue={editData?.tsunami_hazard_zone ? "true" : "false"}
                  className="input"
                >
                  <option value="false">区域外</option>
                  <option value="true">区域内</option>
                </select>
              </div>
            </div>
          </Section>

          {/* 取引・備考 */}
          <Section title="取引・備考">
            <div>
              <Label>取引形態</Label>
              <select
                name="transaction_type"
                defaultValue={editData?.transaction_type || ""}
                className="input max-w-xs"
              >
                <option value="">選択してください</option>
                <option value="owner">貸主</option>
                <option value="agent">代理</option>
                <option value="intermediary">仲介</option>
                <option value="sublet">サブリース</option>
              </select>
            </div>

            <div>
              <Label>アピールポイント</Label>
              <textarea
                name="appeal_points"
                defaultValue={editData?.appeal_points || ""}
                className="input min-h-[60px]"
                placeholder="募集時のアピールポイント"
                rows={2}
              />
            </div>

            <div>
              <Label>備考</Label>
              <textarea
                name="notes"
                defaultValue={editData?.notes || ""}
                className="input min-h-[60px]"
                placeholder="備考"
                rows={2}
              />
            </div>

            <div>
              <Label>社内メモ</Label>
              <textarea
                name="internal_memo"
                defaultValue={editData?.internal_memo || ""}
                className="input min-h-[60px]"
                placeholder="社内用メモ（外部には表示されません）"
                rows={2}
              />
            </div>
          </Section>

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
