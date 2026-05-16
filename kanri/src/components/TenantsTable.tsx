"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import { formatPhone } from "@/lib/phone";

interface TenantsTableProps {
  data: Record<string, any>[];
}

const AVATAR_TONES = [
  { bg: "#e8f0e8", fg: "#3f5a4c" },
  { bg: "#e1e8f1", fg: "#3a5580" },
  { bg: "#f8eed8", fg: "#8a6420" },
  { bg: "#fbe6dc", fg: "#8a4020" },
  { bg: "#e8e0f0", fg: "#5a4080" },
  { bg: "#d8e8e8", fg: "#2a5050" },
];

function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

export default function TenantsTable({ data }: TenantsTableProps) {
  const router = useRouter();

  return (
    <FilterableTable
      data={data}
      searchFields={["name", "name_kana", "phone", "email"]}
      searchPlaceholder="名前・電話番号・メールで検索..."
      columns={[
        {
          key: "name",
          label: "名前",
          sortable: true,
          render: (item) => {
            const tone = avatarTone(item.name || "");
            return (
              <div className="tn-name-cell">
                <span className="tn-av" style={{
                  width: 28, height: 28, fontSize: 11,
                  background: tone.bg, color: tone.fg,
                }}>
                  {(item.name || "?").charAt(0)}
                </span>
                <div>
                  <span className="strong">{item.name}</span>
                  {item.name_kana && <div className="tn-kana">{item.name_kana}</div>}
                </div>
              </div>
            );
          },
        },
        { key: "phone", label: "電話番号", render: (item) => <span className="mono" style={{ fontSize: 12 }}>{formatPhone(item.phone) || "—"}</span> },
        {
          key: "contract.unit.property.name",
          label: "物件・部屋",
          render: (item) =>
            item.contract?.unit ? (
              <span>
                <span style={{ color: "var(--ink-2)" }}>{item.contract.unit.property?.name}</span>
                <span className="mono" style={{ marginLeft: 6, color: "var(--ink-3)", fontSize: 11 }}>#{item.contract.unit.unit_number}</span>
              </span>
            ) : (
              <span style={{ color: "var(--ink-3)" }}>—</span>
            ),
        },
        {
          key: "contract.rent",
          label: "賃料",
          align: "right" as const,
          sortable: true,
          render: (item) => (
            <span className="num">
              {item.contract ? `¥${Number(item.contract.rent).toLocaleString()}` : "—"}
            </span>
          ),
        },
      ]}
      onRowClick={(item) => router.push(`/tenants/${item.id}`)}
    />
  );
}
