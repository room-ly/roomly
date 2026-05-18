"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { propertySchema, type PropertyFormData } from "@/lib/schemas";
import { toWareki } from "@/lib/wareki";
import type { ZodError } from "zod";

interface Owner {
  id: string;
  name: string;
}

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: Owner[];
  editData?: Record<string, any> | null;
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
  editData,
}: PropertyFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [builtYearWareki, setBuiltYearWareki] = useState(() => {
    const y = editData?.built_year;
    return y ? toWareki(y) : "";
  });
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    () => editData?.common_facilities || []
  );

  if (!isOpen) return null;

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
        setApiError(err.error || "エラーが発生しました");
        return;
      }

      onClose();
      router.refresh();
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-3">
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
          </Section>

          {/* 所在地 */}
          <Section title="所在地" defaultOpen>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>郵便番号</Label>
                <input
                  name="postal_code"
                  defaultValue={editData?.postal_code || ""}
                  className="input"
                  placeholder="例: 160-0023"
                />
              </div>
              <div>
                <Label>都道府県</Label>
                <input
                  name="prefecture"
                  defaultValue={editData?.prefecture || ""}
                  className="input"
                  placeholder="例: 東京都"
                />
              </div>
              <div>
                <Label>市区町村</Label>
                <input
                  name="city"
                  defaultValue={editData?.city || ""}
                  className="input"
                  placeholder="例: 新宿区"
                />
              </div>
              <div>
                <Label>町名</Label>
                <input
                  name="town"
                  defaultValue={editData?.town || ""}
                  className="input"
                  placeholder="例: 西新宿"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>住所</Label>
                <input
                  name="address"
                  defaultValue={editData?.address || ""}
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
                <input
                  name="nearest_station"
                  defaultValue={editData?.nearest_station || ""}
                  className="input"
                  placeholder="例: JR山手線 新宿駅"
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
                <input
                  name="nearest_station_2"
                  defaultValue={editData?.nearest_station_2 || ""}
                  className="input"
                  placeholder="例: 都営大江戸線 都庁前駅"
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
                <input
                  name="nearest_station_3"
                  defaultValue={editData?.nearest_station_3 || ""}
                  className="input"
                  placeholder="例: 丸ノ内線 西新宿駅"
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
                  defaultValue={editData?.built_year || ""}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>管理手数料率（%）</Label>
                <input
                  name="management_fee_rate"
                  type="number"
                  step="0.1"
                  defaultValue={editData?.management_fee_rate ?? "5"}
                  className="input"
                  placeholder="例: 5"
                />
                <FieldError errors={errors} field="management_fee_rate" />
              </div>
              <div>
                <Label>管理形態</Label>
                <select
                  name="management_form"
                  defaultValue={editData?.management_form || ""}
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

          <div className="flex justify-end gap-2 pt-3">
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
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
