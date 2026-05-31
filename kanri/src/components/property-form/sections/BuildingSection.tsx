"use client";

import { Section } from "../Section";
import { Label, FieldError, type FormErrors, type EditData } from "../FormPrimitives";
import { toWareki } from "@/lib/wareki";

export default function BuildingSection({
  editData,
  errors,
  builtYearWareki,
  setBuiltYearWareki,
}: {
  editData: EditData;
  errors: FormErrors;
  builtYearWareki: string;
  setBuiltYearWareki: (v: string) => void;
}) {
  return (
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
  );
}
