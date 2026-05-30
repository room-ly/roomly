import { notFound } from "next/navigation";
import Link from "next/link";
import { getCaseDetail, getPropertiesForSelect } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import CaseDetailClient from "@/components/CaseDetailClient";
import AuditLogSection from "@/components/AuditLogSection";

const categoryLabels: Record<string, string> = {
  repair: "設備修繕",
  key: "鍵対応",
  common_area: "共用部",
  tenant_trouble: "入居者間トラブル",
  neighbor: "近隣対応",
  inspection: "点検立会",
  inquiry: "質問・相談",
  request: "要望",
  complaint: "クレーム",
  other: "その他",
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, properties] = await Promise.all([
    getCaseDetail(id),
    getPropertiesForSelect(),
  ]);
  if (!result) notFound();

  const { case: caseRow, logs } = result;

  return (
    <>
      <div className="detail-back">
        <Link href="/cases" className="rlink is-muted is-back">← 対応案件一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{caseRow.title}</h1>
            <div className="detail-kana">
              {caseRow.property?.name || "物件未指定"}{caseRow.unit?.unit_number ? ` ${caseRow.unit.unit_number}` : caseRow.property ? " 共用部" : ""}
            </div>
          </div>
          <div style={{ marginLeft: 8, display: "flex", gap: 6 }}>
            <StatusBadge status={caseRow.status} />
            <StatusBadge status={caseRow.priority} />
          </div>
        </div>
        <div className="detail-header-actions">
          <CaseDetailClient caseRow={caseRow} properties={properties} />
        </div>
      </div>

      <div className="cols-summary" style={{ marginBottom: 24 }}>
        <div className="sum-card">
          <span className="sum-label mono">状態</span>
          <span className="sum-value"><StatusBadge status={caseRow.status} /></span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">優先度</span>
          <span className="sum-value"><StatusBadge status={caseRow.priority} /></span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">見積</span>
          <span className="sum-value" style={{ fontSize: 16 }}>
            {caseRow.estimated_cost != null ? `¥${Number(caseRow.estimated_cost).toLocaleString()}` : "—"}
          </span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">実費</span>
          <span className="sum-value" style={{ fontSize: 16 }}>
            {caseRow.actual_cost != null ? `¥${Number(caseRow.actual_cost).toLocaleString()}` : "—"}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          <div className="section">
            <div className="section-head-bar"><h2>基本情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">状態</div>
                  <div className="field-value"><StatusBadge status={caseRow.status} /></div>
                </div>
                <div className="field">
                  <div className="field-label mono">優先度</div>
                  <div className="field-value"><StatusBadge status={caseRow.priority} /></div>
                </div>
                <div className="field">
                  <div className="field-label mono">種別</div>
                  <div className="field-value field-plain">{categoryLabels[caseRow.category] || caseRow.category}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">受付日</div>
                  <div className="field-value field-plain mono">{caseRow.reported_date}</div>
                </div>
              </div>
            </div>
          </div>

          {(caseRow.vendor_name || caseRow.estimated_cost != null || caseRow.actual_cost != null || caseRow.scheduled_date || caseRow.completed_date) && (
            <div className="section">
              <div className="section-head-bar"><h2>費用・業者情報</h2></div>
              <div className="section-body">
                <div className="kv-grid">
                  {caseRow.vendor_name && (
                    <div className="field">
                      <div className="field-label mono">業者</div>
                      <div className="field-value field-plain">{caseRow.vendor_name}</div>
                    </div>
                  )}
                  {caseRow.vendor_phone && (
                    <div className="field">
                      <div className="field-label mono">業者連絡先</div>
                      <div className="field-value field-plain mono">{formatPhone(caseRow.vendor_phone)}</div>
                    </div>
                  )}
                  {caseRow.estimated_cost != null && (
                    <div className="field">
                      <div className="field-label mono">見積金額</div>
                      <div className="field-value num">¥{Number(caseRow.estimated_cost).toLocaleString()}</div>
                    </div>
                  )}
                  {caseRow.actual_cost != null && (
                    <div className="field">
                      <div className="field-label mono">実費</div>
                      <div className="field-value num">¥{Number(caseRow.actual_cost).toLocaleString()}</div>
                    </div>
                  )}
                  {caseRow.scheduled_date && (
                    <div className="field">
                      <div className="field-label mono">作業予定日</div>
                      <div className="field-value field-plain mono">{caseRow.scheduled_date}</div>
                    </div>
                  )}
                  {caseRow.completed_date && (
                    <div className="field">
                      <div className="field-label mono">完了日</div>
                      <div className="field-value field-plain mono">{caseRow.completed_date}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(caseRow.description || caseRow.notes) && (
            <div className="section">
              <div className="section-head-bar"><h2>詳細</h2></div>
              <div className="section-body">
                {caseRow.description && (
                  <div style={{ marginBottom: caseRow.notes ? 16 : 0 }}>
                    <span className="field-label mono">説明</span>
                    <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{caseRow.description}</p>
                  </div>
                )}
                {caseRow.notes && (
                  <div style={{ paddingTop: caseRow.description ? 16 : 0, borderTop: caseRow.description ? "1px solid var(--line)" : "none" }}>
                    <span className="field-label mono">備考</span>
                    <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{caseRow.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>対応履歴</h2>
                <span className="desc">{logs.length}件</span>
              </div>
              <div className="section-body flush">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>種別</th>
                      <th>内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="row-hover">
                        <td className="mono" style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                          {log.created_at?.slice(0, 16).replace("T", " ")}
                        </td>
                        <td>{log.action_type && <StatusBadge status={log.action_type} />}</td>
                        <td style={{ whiteSpace: "pre-wrap" }}>{log.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <AuditLogSection table="cases" recordId={caseRow.id} recordLabel="対応案件" />
        </div>

        <div className="detail-col-side">
          <div className="section">
            <div className="section-head-bar"><h2>物件情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">物件</div>
                  <div className="field-value">
                    {caseRow.property?.id ? (
                      <Link href={`/properties/${caseRow.property.id}`} className="rlink">
                        {caseRow.property.name}
                      </Link>
                    ) : (
                      <span className="field-plain">—</span>
                    )}
                  </div>
                </div>
                {caseRow.property?.address && (
                  <div className="field">
                    <div className="field-label mono">住所</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{caseRow.property.address}</div>
                  </div>
                )}
                {caseRow.property && (
                  <div className="field">
                    <div className="field-label mono">部屋</div>
                    <div className="field-value field-plain mono">{caseRow.unit?.unit_number || "共用部"}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
