// ダッシュボードのサマリーカード用の軽量SVGミニグラフ。
// 依存ライブラリを増やさず、現状データの範囲で「一目で傾向が分かる」最小実装。

/** 数値の系列を折れ線スパークラインで描く。末尾に強調ドット。 */
export function Sparkline({
  values,
  width = 72,
  height = 28,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + (1 - (v - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    `${pad},${height - pad} ` +
    pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` ${width - pad},${height - pad}`;
  const last = pts[pts.length - 1];
  return (
    <svg
      className="sum-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
    >
      <polygon className="sum-spark-fill" points={area} />
      <polyline className="sum-spark-line" points={line} />
      <circle className="sum-spark-dot" cx={last[0]} cy={last[1]} r={2.2} />
    </svg>
  );
}

/** 割合(0〜100)をドーナツで描く。中央に整数%を表示。 */
export function Donut({
  percent,
  size = 48,
  stroke = 6,
  color,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  /** 値弧の色（CSS変数等）。未指定なら --accent */
  color?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
    >
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
        strokeDasharray={`${dash.toFixed(1)} ${c.toFixed(1)}`}
        style={color ? { stroke: color } : undefined}
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
