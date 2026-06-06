// GA4 client_id をブラウザから取得する。
// 取得失敗時は null を返す。サインアップ/ログイン時にattributionと一緒に送る。

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
  }
}

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID || "G-Y2943F8G2J";

// `_ga` cookie から client_id を直接読む。値は `GA1.1.<clientId高位>.<clientId低位>` 形式で、
// 末尾2セグメントを `.` で繋いだものが client_id（例: GA1.1.1380058937.1780645882 → 1380058937.1780645882）。
// gtag がまだ読み込まれていない／ブロックされている環境でも取得できるフォールバック。
function readGaClientIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
    if (!match) return null;
    const parts = decodeURIComponent(match[1]).split(".");
    // GA1.<domainDepth>.<id1>.<id2>
    if (parts.length >= 4) {
      const clientId = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
      return /^\d+\.\d+$/.test(clientId) ? clientId : null;
    }
  } catch {
    // 無視
  }
  return null;
}

export async function getGaClientId(timeoutMs = 800): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // まず cookie から即時取得を試みる（gtag のロード状況に依存しない最も確実な経路）
  const fromCookie = readGaClientIdFromCookie();
  if (fromCookie) return fromCookie;

  if (!window.gtag || !GA_MEASUREMENT_ID) return null;

  // cookie に無い場合のみ gtag コールバックで取得（タイムアウト時は再度 cookie を確認）
  return new Promise<string | null>((resolve) => {
    let settled = false;
    const done = (v: string | null) => {
      if (settled) return;
      settled = true;
      resolve(v ?? readGaClientIdFromCookie());
    };
    const timer = window.setTimeout(() => done(null), timeoutMs);
    try {
      window.gtag!("get", GA_MEASUREMENT_ID, "client_id", (clientId: unknown) => {
        window.clearTimeout(timer);
        done(typeof clientId === "string" && clientId.length > 0 ? clientId : null);
      });
    } catch {
      window.clearTimeout(timer);
      done(null);
    }
  });
}
