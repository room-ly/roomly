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

export async function getGaClientId(timeoutMs = 800): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!window.gtag || !GA_MEASUREMENT_ID) return null;

  return new Promise<string | null>((resolve) => {
    let settled = false;
    const done = (v: string | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
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
