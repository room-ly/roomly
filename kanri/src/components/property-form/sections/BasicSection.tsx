"use client";

import { Section } from "../Section";
import { Label, FieldError, type FormErrors, type EditData } from "../FormPrimitives";

interface Owner {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  label: string;
  role?: string;
}

export default function BasicSection({
  editData,
  errors,
  owners,
  users,
}: {
  editData: EditData;
  errors: FormErrors;
  owners: Owner[];
  users: UserOption[];
}) {
  return (
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
  );
}
