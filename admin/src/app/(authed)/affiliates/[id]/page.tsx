"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  prospect_type: string | null;
  website_url: string | null;
  social_url: string | null;
  status: string;
  commission_initial_jpy: number;
  commission_recurring_rate: number;
  commission_recurring_months: number;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  invoice_registration_number: string | null;
  source: string;
  notes: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  created_at: string;
};

type Conversion = {
  id: string;
  conversion_type: string;
  amount_jpy: number;
  mrr_at_conversion_jpy: number | null;
  recurring_month_index: number | null;
  status: string;
  occurred_at: string;
  notes: string | null;
};

type Click = {
  clicked_at: string;
  landing_path: string | null;
  referrer: string | null;
  utm_source: string | null;
};

type ReferredCompany = {
  id: string;
  name: string;
  subscription_status: string | null;
  subscription_started_at: string | null;
  plan: string | null;
  max_units: number | null;
  created_at: string;
};

type DetailResponse = {
  affiliate: Affiliate;
  conversions: Conversion[];
  clicks: Click[];
  companies: ReferredCompany[];
};

const CONV_TYPE_LABEL: Record<string, string> = {
  signup: "登録",
  first_payment: "初回有料化",
  recurring_payment: "継続報酬",
};

const CONV_STATUS_LABEL: Record<string, string> = {
  pending: "承認待ち",
  approved: "承認済",
  paid: "支払済",
  rejected: "却下",
  clawback: "取消",
};

export default function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "overview" | "conversions" | "companies" | "clicks" | "bank"
  >("overview");

  const load = () => {
    setError(null);
    fetch(`/api/affiliates/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status: string, rejectedReason?: string) => {
    if (!confirm(`ステータスを「${status}」に変更しますか?`)) return;
    const res = await fetch(`/api/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(rejectedReason ? { rejected_reason: rejectedReason } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || "更新失敗");
      return;
    }
    load();
  };

  if (error) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
        <Link href="/affiliates" className="text-accent text-sm mt-3 inline-block">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-ink-3 text-sm">読み込み中...</div>;
  }

  const { affiliate, conversions, clicks, companies } = data;
  const totalPending = conversions
    .filter((c) => c.status === "pending")
    .reduce((acc, c) => acc + c.amount_jpy, 0);
  const totalApproved = conversions
    .filter((c) => c.status === "approved" || c.status === "paid")
    .reduce((acc, c) => acc + c.amount_jpy, 0);

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-4">
        <Link
          href="/affiliates"
          className="text-accent text-sm hover:underline"
        >
          ← アフィリエイト一覧
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">{affiliate.name}</h1>
          <div className="text-sm text-ink-3">
            {affiliate.email}{" "}
            ・ コード{" "}
            <code className="bg-surface-2 px-1.5 py-0.5 rounded text-xs">
              {affiliate.code}
            </code>{" "}
            ・ 紹介リンク{" "}
            <code className="bg-surface-2 px-1.5 py-0.5 rounded text-xs">
              https://hp.roomly.jp/?ref={affiliate.code}
            </code>
          </div>
        </div>
        <div className="flex gap-2">
          {affiliate.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus("active")}
                className="btn btn-primary text-sm"
              >
                承認する
              </button>
              <button
                onClick={() => {
                  const reason = prompt("拒否理由（任意）");
                  if (reason !== null) {
                    updateStatus("rejected", reason || undefined);
                  }
                }}
                className="btn btn-secondary text-sm"
              >
                拒否
              </button>
            </>
          )}
          {affiliate.status === "active" && (
            <button
              onClick={() => updateStatus("suspended")}
              className="btn btn-secondary text-sm"
            >
              停止
            </button>
          )}
          {affiliate.status === "suspended" && (
            <button
              onClick={() => updateStatus("active")}
              className="btn btn-primary text-sm"
            >
              再開
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="ステータス" value={affiliate.status} />
        <Stat
          label="紹介社数"
          value={`${companies.length}社`}
          sub={`稼動中 ${companies.filter((c) => c.subscription_status === "active").length}`}
        />
        <Stat
          label="未承認報酬"
          value={`¥${totalPending.toLocaleString()}`}
          sub={`${conversions.filter((c) => c.status === "pending").length}件`}
        />
        <Stat
          label="承認済報酬累計"
          value={`¥${totalApproved.toLocaleString()}`}
          sub={`${conversions.filter((c) => c.status === "approved" || c.status === "paid").length}件`}
        />
      </div>

      <div className="mb-4 flex gap-1 border-b border-line">
        {(
          [
            ["overview", "概要"],
            ["conversions", "報酬"],
            ["companies", "紹介企業"],
            ["clicks", "クリック"],
            ["bank", "支払い情報"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-accent text-accent font-medium"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab affiliate={affiliate} />}
      {tab === "conversions" && (
        <ConversionsTab conversions={conversions} onChange={load} />
      )}
      {tab === "companies" && <CompaniesTab companies={companies} />}
      {tab === "clicks" && <ClicksTab clicks={clicks} />}
      {tab === "bank" && <BankTab affiliate={affiliate} onSaved={load} id={id} />}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-3">
      <div className="text-xs text-ink-3 mb-1">{label}</div>
      <div className="text-lg font-semibold text-ink">{value}</div>
      {sub && <div className="text-xs text-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
}

function OverviewTab({ affiliate }: { affiliate: Affiliate }) {
  return (
    <div className="rounded-md border border-line bg-surface p-5 space-y-3 text-sm">
      <Row label="種別">{affiliate.prospect_type ?? "-"}</Row>
      <Row label="ウェブサイト">
        {affiliate.website_url ? (
          <a
            href={affiliate.website_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline break-all"
          >
            {affiliate.website_url}
          </a>
        ) : (
          "-"
        )}
      </Row>
      <Row label="SNS">
        {affiliate.social_url ? (
          <a
            href={affiliate.social_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline break-all"
          >
            {affiliate.social_url}
          </a>
        ) : (
          "-"
        )}
      </Row>
      <Row label="電話">{affiliate.phone ?? "-"}</Row>
      <Row label="登録経路">
        {affiliate.source === "self_signup" ? "本人申込" : "直接登録"}
      </Row>
      <Row label="申込日">
        {new Date(affiliate.created_at).toLocaleString("ja-JP")}
      </Row>
      {affiliate.approved_at && (
        <Row label="承認日">
          {new Date(affiliate.approved_at).toLocaleString("ja-JP")}
        </Row>
      )}
      {affiliate.rejected_at && (
        <Row label="拒否日">
          {new Date(affiliate.rejected_at).toLocaleString("ja-JP")}
          {affiliate.rejected_reason && (
            <div className="text-xs text-ink-3 mt-1">
              理由: {affiliate.rejected_reason}
            </div>
          )}
        </Row>
      )}
      <Row label="初回報酬">
        ¥{affiliate.commission_initial_jpy.toLocaleString()}
      </Row>
      <Row label="継続報酬">
        {affiliate.commission_recurring_rate}% ×{" "}
        {affiliate.commission_recurring_months === 0
          ? "無期限"
          : `${affiliate.commission_recurring_months}ヶ月`}
      </Row>
      {affiliate.notes && (
        <Row label="メモ">
          <div className="whitespace-pre-wrap text-ink-2">{affiliate.notes}</div>
        </Row>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-xs text-ink-3 pt-0.5">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function ConversionsTab({
  conversions,
  onChange,
}: {
  conversions: Conversion[];
  onChange: () => void;
}) {
  const updateConv = async (cid: string, status: string) => {
    if (!confirm(`「${status}」に変更しますか?`)) return;
    const res = await fetch(`/api/affiliate-conversions/${cid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || "更新失敗");
      return;
    }
    onChange();
  };

  if (conversions.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface p-8 text-center text-ink-3 text-sm">
        まだ成果がありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">発生日</th>
            <th className="px-3 py-2 font-medium">種別</th>
            <th className="px-3 py-2 font-medium">月</th>
            <th className="px-3 py-2 font-medium text-right">MRR</th>
            <th className="px-3 py-2 font-medium text-right">報酬</th>
            <th className="px-3 py-2 font-medium">ステータス</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((c) => (
            <tr key={c.id} className="border-t border-line">
              <td className="px-3 py-2 text-ink-3 text-xs">
                {new Date(c.occurred_at).toLocaleString("ja-JP")}
              </td>
              <td className="px-3 py-2">
                {CONV_TYPE_LABEL[c.conversion_type] ?? c.conversion_type}
              </td>
              <td className="px-3 py-2 text-ink-3">
                {c.recurring_month_index ? `${c.recurring_month_index}ヶ月目` : "-"}
              </td>
              <td className="px-3 py-2 text-right text-ink-2">
                {c.mrr_at_conversion_jpy
                  ? `¥${c.mrr_at_conversion_jpy.toLocaleString()}`
                  : "-"}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                ¥{c.amount_jpy.toLocaleString()}
              </td>
              <td className="px-3 py-2">
                <ConvStatusBadge status={c.status} />
              </td>
              <td className="px-3 py-2 text-right">
                {c.status === "pending" && (
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => updateConv(c.id, "approved")}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      承認
                    </button>
                    <span className="text-ink-3">/</span>
                    <button
                      onClick={() => updateConv(c.id, "rejected")}
                      className="text-xs text-red-600 hover:underline"
                    >
                      却下
                    </button>
                  </div>
                )}
                {c.status === "approved" && (
                  <button
                    onClick={() => updateConv(c.id, "clawback")}
                    className="text-xs text-zinc-600 hover:underline"
                  >
                    取消
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConvStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
    paid: "bg-blue-100 text-blue-700 border-blue-300",
    rejected: "bg-red-100 text-red-700 border-red-300",
    clawback: "bg-zinc-100 text-zinc-700 border-zinc-300",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs border ${
        colors[status] ?? ""
      }`}
    >
      {CONV_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function CompaniesTab({ companies }: { companies: ReferredCompany[] }) {
  if (companies.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface p-8 text-center text-ink-3 text-sm">
        まだ紹介企業がありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">会社名</th>
            <th className="px-3 py-2 font-medium">プラン</th>
            <th className="px-3 py-2 font-medium">課金状態</th>
            <th className="px-3 py-2 font-medium">有料開始日</th>
            <th className="px-3 py-2 font-medium">登録日</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-t border-line">
              <td className="px-3 py-2">{c.name}</td>
              <td className="px-3 py-2 text-ink-2">
                {c.plan ?? "-"}
                {c.max_units ? ` (${c.max_units}区画)` : ""}
              </td>
              <td className="px-3 py-2 text-ink-2">
                {c.subscription_status ?? "-"}
              </td>
              <td className="px-3 py-2 text-ink-3 text-xs">
                {c.subscription_started_at
                  ? new Date(c.subscription_started_at).toLocaleDateString(
                      "ja-JP"
                    )
                  : "-"}
              </td>
              <td className="px-3 py-2 text-ink-3 text-xs">
                {new Date(c.created_at).toLocaleDateString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClicksTab({ clicks }: { clicks: Click[] }) {
  if (clicks.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface p-8 text-center text-ink-3 text-sm">
        まだクリックがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">日時</th>
            <th className="px-3 py-2 font-medium">着地ページ</th>
            <th className="px-3 py-2 font-medium">リファラ</th>
            <th className="px-3 py-2 font-medium">utm_source</th>
          </tr>
        </thead>
        <tbody>
          {clicks.map((c, i) => (
            <tr key={i} className="border-t border-line">
              <td className="px-3 py-2 text-ink-3 text-xs">
                {new Date(c.clicked_at).toLocaleString("ja-JP")}
              </td>
              <td className="px-3 py-2 text-ink-2 text-xs break-all">
                {c.landing_path ?? "-"}
              </td>
              <td className="px-3 py-2 text-ink-3 text-xs break-all">
                {c.referrer ?? "-"}
              </td>
              <td className="px-3 py-2 text-ink-3 text-xs">
                {c.utm_source ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BankTab({
  affiliate,
  onSaved,
  id,
}: {
  affiliate: Affiliate;
  onSaved: () => void;
  id: string;
}) {
  const [form, setForm] = useState({
    bank_name: affiliate.bank_name ?? "",
    bank_branch: affiliate.bank_branch ?? "",
    bank_account_type: affiliate.bank_account_type ?? "",
    bank_account_number: affiliate.bank_account_number ?? "",
    bank_account_holder: affiliate.bank_account_holder ?? "",
    invoice_registration_number: affiliate.invoice_registration_number ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || "保存失敗");
      return;
    }
    onSaved();
  };

  return (
    <form
      onSubmit={save}
      className="rounded-md border border-line bg-surface p-5 space-y-3 text-sm"
    >
      <div className="text-xs text-ink-3 mb-2">
        振込先情報は支払い前に登録してください
      </div>
      {[
        ["bank_name", "銀行名"],
        ["bank_branch", "支店"],
        ["bank_account_type", "口座種別 (普通/当座)"],
        ["bank_account_number", "口座番号"],
        ["bank_account_holder", "口座名義 (カナ)"],
        ["invoice_registration_number", "インボイス登録番号"],
      ].map(([k, label]) => (
        <label key={k} className="block">
          <div className="text-xs font-medium text-ink-2 mb-1">{label}</div>
          <input
            type="text"
            value={(form as Record<string, string>)[k]}
            onChange={(e) =>
              setForm({ ...form, [k]: e.target.value } as typeof form)
            }
            className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
          />
        </label>
      ))}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
