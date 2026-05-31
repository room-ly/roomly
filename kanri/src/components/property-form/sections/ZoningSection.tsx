"use client";

import { Section } from "../Section";
import { Label, type EditData } from "../FormPrimitives";

export default function ZoningSection({ editData }: { editData: EditData }) {
  return (
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
  );
}
