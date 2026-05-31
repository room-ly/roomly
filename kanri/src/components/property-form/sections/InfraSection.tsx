"use client";

import { Section } from "../Section";
import { Label, type EditData } from "../FormPrimitives";

export default function InfraSection({ editData }: { editData: EditData }) {
  return (
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
  );
}
