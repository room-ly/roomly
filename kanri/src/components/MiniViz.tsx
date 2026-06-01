// ダッシュボードのサマリーカード用の軽量SVGミニグラフ。
// 目的は「データの厳密な読み取り」ではなく「先進的で洗練された第一印象」。
// グラデーション + 微光（グロー）+ 滑らかな曲線 + 描画アニメーションで魅せる。
// 依存ライブラリは増やさず純SVG。

import type { CSSProperties } from "react";

/** SVG内に1度だけ置くグラデーション/グロー定義。idはカードごとにユニークにする。 */
function VizDefs({ id, from, to }: { id: string; from?: string; to?: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={from ?? "var(--viz-grad-from)"} />
        <stop offset="100%" stopColor={to ?? "var(--viz-grad-to)"} />
      </linearGradient>
      <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={from ?? "var(--viz-grad-from)"} stopOpacity="0.28" />
        <stop offset="100%" stopColor={from ?? "var(--viz-grad-from)"} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/** 点列を滑らかなCatmull-Romスプライン → 3次ベジェのパス文字列に変換 */
function smoothPath(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length < 2) return "";
  const d: string[] = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    );
  }
  return d.join(" ");
}

/** 数値系列を滑らかな曲線スパークラインで描く。グラデーション塗り + 発光 + 描画アニメ。 */
export function Sparkline({
  values,
  width = 84,
  height = 32,
  id = "spark",
}: {
  values: number[];
  width?: number;
  height?: number;
  id?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = values.map((v, i): readonly [number, number] => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + (1 - (v - min) / span) * h;
    return [x, y];
  });
  const linePath = smoothPath(pts);
  const fillPath = `${linePath} L ${pts[pts.length - 1][0].toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
  const last = pts[pts.length - 1];
  // 描画アニメ用のおおよそのパス長（曲線なので幅ベースで概算 + 余裕）
  const sparkLen = Math.round(width * 1.6);

  return (
    <svg
      className="sum-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
      style={{ ["--spark-len" as string]: String(sparkLen) } as CSSProperties}
    >
      <VizDefs id={id} />
      <path className="sum-spark-fill" d={fillPath} fill={`url(#${id}-fill)`} />
      <path className="sum-spark-line" d={linePath} stroke={`url(#${id}-stroke)`} />
      <circle className="sum-spark-dot" cx={last[0]} cy={last[1]} r={2.6} />
    </svg>
  );
}

/** 割合(0〜100)をグラデーションの弧で描く。発光 + 角丸キャップ + 充填アニメ。中央に整数%。 */
export function Donut({
  percent,
  size = 50,
  stroke = 6,
  id = "donut",
  from,
  to,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  id?: string;
  /** グラデーション開始/終了色（CSS変数等）。未指定なら先進感グラデーション */
  from?: string;
  to?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <svg
      className="sum-donut"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
      style={
        {
          ["--donut-circ" as string]: c.toFixed(1),
          ["--donut-dash" as string]: `${dash.toFixed(1)} ${(c - dash).toFixed(1)}`,
        } as CSSProperties
      }
    >
      <VizDefs id={id} from={from} to={to} />
      <circle
        className="sum-donut-track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
      />
      <circle
        className="sum-donut-val"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        stroke={`url(#${id}-stroke)`}
      />
      <text
        className="sum-donut-label"
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {Math.round(p)}
      </text>
    </svg>
  );
}
