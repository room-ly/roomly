"use client";

import { Section } from "../Section";
import { Label, FieldError, type FormErrors, type EditData } from "../FormPrimitives";
import PostalCodeInput from "../../PostalCodeInput";

export default function AddressSection({
  editData,
  errors,
  address,
  setAddress,
}: {
  editData: EditData;
  errors: FormErrors;
  address: string;
  setAddress: (v: string) => void;
}) {
  return (
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
  );
}
