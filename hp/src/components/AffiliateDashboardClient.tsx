"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DashboardData = {
  affiliate: {
    code: string;
    name: string;
    email: string;
    commission_recurring_rate: number;
    commission_recurring_months: number;
    approved_at: string | null;
    created_at: string;
  };
  stats: {
    click_count: number;
    conversion_count: number;
    pending_amount_jpy: number;
    approved_amount_jpy: number;
    paid_amount_jpy: number;
  };
  recent_conversions: {
    status: string;
    amount_jpy: number;
    occurred_at: string;
    conversion_type: string;
  }[];
};

const CONV_STATUS_LABEL: Record<string, string> = {
  pending: "保留中",
  approved: "確定",
  paid: "支払済",
  rejected: "却下",
};

const CONV_TYPE_LABEL: Record<string, string> = {
  initial: "初回成果",
  recurring: "継続報酬",
};

function formatJpy(n: number) {
  return "¥" + n.toLocaleString();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AffiliateDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/affiliate/me")
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "情報の取得に失敗しました");
        }
        return res.json();
      })
      .then((d) => setData(d as DashboardData))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/affiliate/logout", { method: "POST" });
      router.push("/affiliate");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl text-center text-[14px] text-rm-text-secondary">
        読み込み中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rm-border bg-rm-surface p-8 text-center">
        <h1 className="text-[20px] font-medium text-rm-primary">
          ダッシュボードを表示できません
        </h1>
        <p className="mt-3 text-[14px] text-rm-text-secondary leading-relaxed">
          {error || "情報の取得に失敗しました"}
        </p>
        <p className="mt-6 text-[13px] text-rm-text-secondary">
          <Link href="/affiliate" className="text-rm-accent-deep underline">
            アフィリエイトプログラム
          </Link>{" "}
          に戻る
        </p>
      </div>
    );
  }

  const referralUrl = `https://hp.roomly.jp/?ref=${data.affiliate.code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] text-rm-text-secondary">
            アフィリエイターダッシュボード
          </div>
          <h1 className="mt-1 text-[24px] font-medium text-rm-primary">
            {data.affiliate.name} 様
          </h1>
          <p className="mt-1 text-[13px] text-rm-text-secondary">
            {data.affiliate.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="shrink-0 rounded-full border border-rm-border bg-rm-surface px-4 py-2 text-[12px] text-rm-text-secondary transition-all hover:bg-rm-bg disabled:opacity-50"
        >
          {loggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
      </header>

      <section className="rounded-2xl border border-rm-border bg-rm-surface p-6">
        <div className="text-[12px] font-medium text-rm-text-secondary">
          あなたの紹介リンク
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[13px] text-rm-primary break-all">
            {referralUrl}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full bg-rm-accent-deep px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:opacity-90"
          >
            {copied ? "コピー済み" : "コピー"}
          </button>
        </div>
        <p className="mt-3 text-[12px] text-rm-text-secondary">
          紹介コード:{" "}
          <span className="font-mono text-rm-primary">{data.affiliate.code}</span>
          {" / "}
          報酬率: 月額の{Number(data.affiliate.commission_recurring_rate)}% を
          {data.affiliate.commission_recurring_months === 0
            ? "期限なく継続"
            : `${data.affiliate.commission_recurring_months}ヶ月`}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="クリック数" value={data.stats.click_count.toLocaleString()} />
        <StatCard
          label="成果件数"
          value={data.stats.conversion_count.toLocaleString()}
        />
        <StatCard
          label="保留中の報酬"
          value={formatJpy(data.stats.pending_amount_jpy)}
          hint="承認待ちの成果"
        />
        <StatCard
          label="確定 + 支払済"
          value={formatJpy(
            data.stats.approved_amount_jpy + data.stats.paid_amount_jpy
          )}
          hint={`うち支払済 ${formatJpy(data.stats.paid_amount_jpy)}`}
        />
      </section>

      <section>
        <h2 className="text-[16px] font-medium text-rm-primary">最近の成果</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-rm-border bg-rm-surface">
          {data.recent_conversions.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-rm-text-secondary">
              まだ成果は記録されていません。リンクを共有して紹介を始めましょう。
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-rm-bg text-rm-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">発生日</th>
                  <th className="px-4 py-3 text-left font-medium">種別</th>
                  <th className="px-4 py-3 text-right font-medium">金額（税込）</th>
                  <th className="px-4 py-3 text-left font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_conversions.map((c, i) => (
                  <tr key={i} className="border-t border-rm-border">
                    <td className="px-4 py-3 text-rm-text">
                      {formatDate(c.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-rm-text">
                      {CONV_TYPE_LABEL[c.conversion_type] || c.conversion_type}
                    </td>
                    <td className="px-4 py-3 text-right text-rm-primary">
                      {formatJpy(c.amount_jpy)}
                    </td>
                    <td className="px-4 py-3 text-rm-text-secondary">
                      {CONV_STATUS_LABEL[c.status] || c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-rm-border bg-rm-bg p-6 text-[13px] text-rm-text-secondary leading-relaxed">
        <p className="font-medium text-rm-primary">このページについて</p>
        <p className="mt-2">
          このダッシュボードはログイン中のセッションで表示されています。
          別端末からアクセスするには <Link href="/affiliate?tab=login" className="text-rm-accent-deep underline">ログイン</Link> を行ってください。
          パスワードを忘れた場合は <Link href="/affiliate/recover" className="text-rm-accent-deep underline">パスワード再設定</Link> から再設定できます。
        </p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-rm-border bg-rm-surface p-5">
      <div className="text-[12px] text-rm-text-secondary">{label}</div>
      <div className="mt-1 text-[22px] font-medium text-rm-primary">{value}</div>
      {hint && (
        <div className="mt-1 text-[11px] text-rm-text-secondary">{hint}</div>
      )}
    </div>
  );
}
