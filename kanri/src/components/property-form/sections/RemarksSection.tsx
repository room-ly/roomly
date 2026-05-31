"use client";

import { Section } from "../Section";
import { Label, type EditData } from "../FormPrimitives";

export default function RemarksSection({ editData }: { editData: EditData }) {
  return (
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
  );
}
