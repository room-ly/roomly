import { notFound } from "next/navigation";
import Link from "next/link";
import { getContractDetail, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import ContractDetailClient from "@/components/ContractDetailClient";
import MoveOutReviewClient from "@/components/MoveOutReviewClient";
import MoveOutChecklist from "@/components/MoveOutChecklist";

const contractTypeLabels: Record<string, string> = {
  fixed: "定期借家",
  ordinary: "普通借家",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, units, tenants] = await Promise.all([
    getContractDetail(id),
    getUnitsForSelect(),
    getTenantsForSelect(id),
  ]);
  if (!result) notFound();

  const { contract, billings, moveOutRequests, unitContracts } = result;
  const tenant = contract.tenant;
  const unit = contract.unit;
  const property = unit?.property;

  const remainingDays = contract.end_date
    ? Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const monthlyTotal = Number(contract.rent) + Number(contract.management_fee);

  return (
    <>
      <div className="detail-back">
        <Link href="/contracts" className="rlink is-muted is-back">← 契約一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{property?.name} {unit?.unit_number}</h1>
            <div className="detail-kana">{contract.start_date} 〜 {contract.end_date || "期限なし"}</div>
          </div>
          <div style={{ marginLeft: 8, display: "flex", gap: 6, alignItems: "center" }}>
            <StatusBadge status={contract.status} />
            <StatusBadge status={contract.contract_type} />
            {remainingDays !== null && remainingDays <= 90 && (
              <span className={`tag ${remainingDays <= 30 ? "is-danger" : "is-warn"}`}>
                {remainingDays <= 0 ? "期限切れ" : `あと${remainingDays}日`}
              </span>
            )}
          </div>
        </div>
        <div className="detail-header-actions">
          <ContractDetailClient contract={contract} units={units} tenants={tenants} moveOutRequests={moveOutRequests} />
        </div>
      </div>

      {/* サマリーカード */}
      <div className="cols-summary" style={{ marginBottom: 24 }}>
        <div className="sum-card">
          <span className="sum-label mono">月額合計</span>
          <span className="sum-value" style={{ fontSize: 16 }}>¥{monthlyTotal.toLocaleString()}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">契約種別</span>
          <span className="sum-value" style={{ fontSize: 16 }}>{contractTypeLabels[contract.contract_type] || contract.contract_type}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">入居者</span>
          <span className="sum-value" style={{ fontSize: 16 }}>
            <Link href={`/tenants/${tenant?.id}`} className="rlink">{tenant?.name || "—"}</Link>
          </span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">残日数</span>
          <span className="sum-value" style={{ fontSize: 16 }}>
            {remainingDays !== null ? (remainingDays <= 0 ? "期限切れ" : `${remainingDays}日`) : "—"}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 賃料・費用 */}
          <div className="section">
            <div className="section-head-bar"><h2>賃料・費用</h2></div>
            <div className="section-body">
              <div className="cfee-grid">
                <div className="cfee-main">
                  <div className="cfee-label mono">月額合計</div>
                  <div className="cfee-value">¥{monthlyTotal.toLocaleString()}</div>
                </div>
                <div className="cfee-item">
                  <div className="cfee-label mono">賃料</div>
                  <div className="cfee-sub num">¥{Number(contract.rent).toLocaleString()}</div>
                </div>
                <div className="cfee-item">
                  <div className="cfee-label mono">管理費</div>
                  <div className="cfee-sub num">¥{Number(contract.management_fee).toLocaleString()}</div>
                </div>
              </div>
              <div className="kv-grid" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                {Number(contract.deposit) > 0 && (
                  <div className="field">
                    <div className="field-label mono">敷金</div>
                    <div className="field-value num">¥{Number(contract.deposit).toLocaleString()}</div>
                  </div>
                )}
                {Number(contract.key_money) > 0 && (
                  <div className="field">
                    <div className="field-label mono">礼金</div>
                    <div className="field-value num">¥{Number(contract.key_money).toLocaleString()}</div>
                  </div>
                )}
                {Number(contract.renewal_fee) > 0 && (
                  <div className="field">
                    <div className="field-label mono">更新料</div>
                    <div className="field-value num">¥{Number(contract.renewal_fee).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 契約条件 */}
          <div className="section">
            <div className="section-head-bar"><h2>契約条件</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">契約種別</div>
                  <div className="field-value"><StatusBadge status={contract.contract_type} /></div>
                </div>
                <div className="field">
                  <div className="field-label mono">契約期間</div>
                  <div className="field-value field-plain mono">{contract.start_date} 〜 {contract.end_date || "期限なし"}</div>
                </div>
                {contract.guarantor_name && (
                  <div className="field">
                    <div className="field-label mono">保証人</div>
                    <div className="field-value field-plain">
                      {contract.guarantor_name}
                      {contract.guarantor_phone && <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: "var(--ink-3)" }}>{contract.guarantor_phone}</span>}
                    </div>
                  </div>
                )}
                {contract.insurance_company && (
                  <div className="field">
                    <div className="field-label mono">保険会社</div>
                    <div className="field-value field-plain">{contract.insurance_company}</div>
                  </div>
                )}
              </div>
              {contract.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">備考</span>
                  <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{contract.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* 請求履歴 */}
          {billings.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>請求履歴</h2>
                <span className="desc">直近12ヶ月</span>
              </div>
              <div className="section-body flush">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>対象月</th>
                      <th style={{ textAlign: "right" }}>請求額</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((b: any) => (
                      <tr key={b.id} className={`row-hover ${b.status === "overdue" ? "bg-danger-tint" : ""}`}>
                        <td>
                          <Link href={`/rent/${b.id}`} className="rlink">{b.billing_month}</Link>
                        </td>
                        <td className="num">¥{Number(b.total_amount).toLocaleString()}</td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 退去申請 */}
          {moveOutRequests.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>退去申請</h2>
                <span className="desc">{moveOutRequests.length}件</span>
              </div>
              <div className="section-body">
                {moveOutRequests.map((req: any) => (
                  <div key={req.id} className="moveout-card" style={{
                    border: req.status === "pending" ? "2px solid var(--warn)" : "1px solid var(--line)",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: moveOutRequests.length > 1 ? 12 : 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {req.status === "pending" && <span className="tag is-warn">未処理</span>}
                        <span style={{ fontSize: 13, fontWeight: 500 }}>退去希望日: <span className="mono">{req.desired_move_out_date}</span></span>
                      </div>
                      <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>申請日: {req.created_at?.slice(0, 10)}</span>
                    </div>

                    <div className="kv-grid">
                      {req.reason && (
                        <div className="field">
                          <div className="field-label mono">理由</div>
                          <div className="field-value field-plain">{req.reason}</div>
                        </div>
                      )}
                      {(req.forwarding_address || req.forwarding_phone) && (
                        <div className="field">
                          <div className="field-label mono">転居先</div>
                          <div className="field-value field-plain">
                            {req.forwarding_postal_code && `〒${req.forwarding_postal_code} `}
                            {req.forwarding_address && `${req.forwarding_address} `}
                            {req.forwarding_phone && `TEL: ${req.forwarding_phone}`}
                          </div>
                        </div>
                      )}
                      {req.bank_name && (
                        <div className="field">
                          <div className="field-label mono">敷金返還先</div>
                          <div className="field-value field-plain">{req.bank_name} {req.bank_branch} {req.bank_account_type} {req.bank_account_number}（{req.bank_account_holder}）</div>
                        </div>
                      )}
                      {req.review_notes && req.status !== "pending" && (
                        <div className="field">
                          <div className="field-label mono">備考</div>
                          <div className="field-value field-plain">{req.review_notes}</div>
                        </div>
                      )}
                    </div>

                    {req.change_log && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                        <div className="field-label mono" style={{ marginBottom: 6 }}>変更履歴</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                          {req.change_log}
                        </div>
                      </div>
                    )}

                    <MoveOutReviewClient request={req} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* 退去チェックリスト（退去申請がある場合に表示） */}
          {moveOutRequests.length > 0 && (
            <MoveOutChecklist contractId={contract.id} />
          )}

          {/* この部屋の契約履歴 */}
          {unitContracts.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>この部屋の契約履歴</h2>
                <span className="desc">{unitContracts.length}件</span>
              </div>
              <div className="section-body flush">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>入居者</th>
                      <th>契約期間</th>
                      <th>種別</th>
                      <th style={{ textAlign: "right" }}>賃料</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitContracts.map((uc: any) => (
                      <tr key={uc.id} className="row-hover">
                        <td>
                          {uc.tenant?.id ? (
                            <Link href={`/tenants/${uc.tenant.id}`} className="rlink">{uc.tenant.name}</Link>
                          ) : (
                            <span style={{ color: "var(--ink-3)" }}>—</span>
                          )}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {uc.start_date} 〜 {uc.end_date || "—"}
                        </td>
                        <td><StatusBadge status={uc.contract_type} /></td>
                        <td className="num">¥{Number(uc.rent).toLocaleString()}</td>
                        <td><StatusBadge status={uc.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          <div className="section">
            <div className="section-head-bar"><h2>入居者</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value">
                    <Link href={`/tenants/${tenant?.id}`} className="rlink">{tenant?.name || "—"}</Link>
                    {tenant?.name_kana && <span style={{ marginLeft: 6, fontSize: 12, color: "var(--ink-3)" }}>{tenant.name_kana}</span>}
                  </div>
                </div>
                {tenant?.phone && (
                  <div className="field">
                    <div className="field-label mono">電話</div>
                    <div className="field-value">
                      <a href={`tel:${tenant.phone}`} className="rlink mono" style={{ fontSize: 12 }}>{formatPhone(tenant.phone)}</a>
                    </div>
                  </div>
                )}
                {tenant?.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value">
                      <a href={`mailto:${tenant.email}`} className="rlink" style={{ fontSize: 12 }}>{tenant.email}</a>
                    </div>
                  </div>
                )}
                {tenant?.workplace && (
                  <div className="field">
                    <div className="field-label mono">勤務先</div>
                    <div className="field-value field-plain">{tenant.workplace}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head-bar"><h2>物件</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">物件名</div>
                  <div className="field-value">
                    <Link href={`/properties/${property?.id}`} className="rlink">{property?.name || "—"}</Link>
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">部屋</div>
                  <div className="field-value field-plain mono">{unit?.unit_number || "—"}</div>
                </div>
                {property?.address && (
                  <div className="field">
                    <div className="field-label mono">住所</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{property.address}</div>
                  </div>
                )}
                {unit?.layout && (
                  <div className="field">
                    <div className="field-label mono">間取り</div>
                    <div className="field-value field-plain">{unit.layout}</div>
                  </div>
                )}
                {unit?.area_sqm && (
                  <div className="field">
                    <div className="field-label mono">面積</div>
                    <div className="field-value field-plain">{unit.area_sqm}㎡</div>
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
