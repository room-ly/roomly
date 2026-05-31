"use client";

import { Section } from "../Section";
import { Label, type EditData } from "../FormPrimitives";

export default function RiskSection({ editData }: { editData: EditData }) {
  return (
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
  );
}
