/* global React */
const { useEffect: _u } = React;

/* ============ Feature rows ============ */
function FeatureRows() {
  return (
    <section id="features">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">All-in-one</span>
          <h2>必要な機能を、<em>ひとつに。</em></h2>
          <p>賃貸管理に必要な機能をすべて備えています。複数のツールを行き来する必要はありません。</p>
        </div>

        <Reveal>
          <div className="feature-row">
            <div className="copy">
              <span className="eyebrow">物件・部屋管理</span>
              <h3>建物も、部屋も、<em>一望できる</em>。</h3>
              <p>建物・部屋・間取り・設備・写真をまとめて管理。空室状況はリアルタイムで反映されます。</p>
              <ul>
                <li>物件の基本情報（住所・構造・築年数）を登録</li>
                <li>各部屋の間取り・面積・家賃・管理費を管理</li>
                <li>空室／入居中ステータスをリアルタイム表示</li>
                <li>オーナー紐付けで送金管理もスムーズに</li>
              </ul>
            </div>
            <div><MockProperties /></div>
          </div>
        </Reveal>

        <Reveal>
          <div className="feature-row reverse">
            <div className="copy">
              <span className="eyebrow">家賃管理</span>
              <h3>請求も入金も、<em>見逃さない</em>。</h3>
              <p>月次の請求を自動生成。入金消込、滞納日数の自動カウント、督促のタイミングまで一画面に。</p>
              <ul>
                <li>毎月の家賃請求を自動生成</li>
                <li>入金消込（全額・部分・取消）</li>
                <li>滞納一覧と滞納日数の自動カウント</li>
                <li>色分けされた見やすいステータス表示</li>
              </ul>
            </div>
            <div><MockRent /></div>
          </div>
        </Reveal>

        <Reveal>
          <div className="feature-row">
            <div className="copy">
              <span className="eyebrow">修繕・オーナー送金</span>
              <h3>受付から精算まで、<em>つながる</em>。</h3>
              <p>修繕依頼を受け付けたら、業者手配・完了報告・経費連携まで自動で繋がる。月末のオーナー送金もボタン一つ。</p>
              <ul>
                <li>修繕依頼を写真・優先度付きで登録</li>
                <li>対応ログをタイムラインで記録</li>
                <li>家賃収入 − 管理手数料 − 経費 を自動計算</li>
                <li>送金明細PDFを自動生成</li>
              </ul>
            </div>
            <div><MockRemit /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Mock UI: property table ============ */
function MockProperties() {
  const rows = [
    { name: "グランド青山", units: "12 / 14", rent: "¥1,820,000", status: "ok" },
    { name: "メゾン代官山", units: "8 / 8", rent: "¥1,240,000", status: "full" },
    { name: "ヴェルデ三軒茶屋", units: "6 / 9", rent: "¥740,000", status: "warn" },
    { name: "コーポ恵比寿", units: "10 / 10", rent: "¥1,180,000", status: "full" },
  ];
  return (
    <div className="frame">
      <div className="frame-head">
        <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
        <span className="frame-title">物件一覧 · 32件</span>
      </div>
      <div className="frame-body" style={{ padding: 0 }}>
        <div style={{ display: "flex", padding: "10px 18px", borderBottom: "1px solid var(--line)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <span style={{ flex: 1.6 }}>物件名</span>
          <span style={{ flex: 1 }}>稼働</span>
          <span style={{ flex: 1, textAlign: "right" }}>月額家賃</span>
        </div>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
            <span style={{ flex: 1.6, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface-tint)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}>
                <Icon.building />
              </span>
              <span style={{ fontWeight: 500 }}>{r.name}</span>
            </span>
            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: r.status === "full" ? "var(--accent)" : r.status === "warn" ? "#d97757" : "var(--ink-3)" }} />
              <span style={{ color: "var(--ink-2)" }}>{r.units}</span>
            </span>
            <span style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.rent}</span>
          </div>
        ))}
        <div style={{ padding: "14px 18px", fontSize: 12, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
          <span>合計 36件中 4件を表示</span>
          <span style={{ color: "var(--accent-deep)" }}>すべて表示 →</span>
        </div>
      </div>
    </div>
  );
}

/* ============ Mock UI: rent ledger ============ */
function MockRent() {
  const rows = [
    { who: "山田 太郎", room: "301号", amt: "¥78,000", state: "paid", date: "5/3" },
    { who: "佐藤 美咲", room: "402号", amt: "¥85,000", state: "paid", date: "5/4" },
    { who: "高橋 健一", room: "105号", amt: "¥72,000", state: "due", date: "5/5" },
    { who: "鈴木 花", room: "203号", amt: "¥80,000", state: "late", date: "−12日" },
  ];
  const badge = (s) => {
    if (s === "paid") return { label: "入金済", bg: "var(--accent-tint)", fg: "var(--accent-deep)" };
    if (s === "due") return { label: "請求中", bg: "var(--surface-tint)", fg: "var(--ink-2)" };
    return { label: "滞納", bg: "#fbe6dc", fg: "#a14a25" };
  };
  return (
    <div className="frame">
      <div className="frame-head">
        <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
        <span className="frame-title">家賃台帳 · 2026年5月</span>
      </div>
      <div className="frame-body" style={{ padding: 0 }}>
        <div style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "center", borderBottom: "1px solid var(--line)" }}>
          {[["回収率", "94%"], ["請求", "427件"], ["滞納", "3件"]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{v}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)" }}>5月</div>
        </div>
        {rows.map((r) => {
          const b = badge(r.state);
          return (
            <div key={r.who} style={{ display: "flex", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
              <span style={{ width: 30, height: 30, borderRadius: 999, background: "var(--surface-tint)", display: "grid", placeItems: "center", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--ink-2)", fontSize: 13 }}>
                {r.who[0]}
              </span>
              <span style={{ marginLeft: 12, fontWeight: 500 }}>{r.who}</span>
              <span style={{ marginLeft: 8, color: "var(--ink-3)", fontSize: 12 }}>{r.room}</span>
              <span style={{ marginLeft: "auto", marginRight: 12, fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.amt}</span>
              <span style={{ background: b.bg, color: b.fg, fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 500 }}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Mock UI: owner remittance ============ */
function MockRemit() {
  return (
    <div className="frame">
      <div className="frame-head">
        <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
        <span className="frame-title">オーナー送金 · 確認</span>
      </div>
      <div className="frame-body">
        <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>2026年5月分 · 田中オーナー</div>
        <div style={{ marginTop: 16, padding: 16, background: "var(--surface-tint)", borderRadius: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--ink-2)" }}>家賃収入</span>
            <span className="mono">¥1,860,000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6, color: "var(--ink-3)" }}>
            <span>− 管理手数料 5%</span>
            <span className="mono">−¥93,000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6, color: "var(--ink-3)" }}>
            <span>− 修繕経費（給湯器交換）</span>
            <span className="mono">−¥42,800</span>
          </div>
          <div style={{ height: 1, background: "var(--line)", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>送金額</span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--accent-deep)", letterSpacing: "-0.02em" }}>¥1,724,200</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ height: 36, fontSize: 13, flex: 1 }}>PDF出力</button>
          <button className="btn btn-accent" style={{ height: 36, fontSize: 13, flex: 1 }}>送金を確定</button>
        </div>
      </div>
    </div>
  );
}

/* ============ 6-up feature grid ============ */
function FeatureGrid() {
  const items = [
    { i: <Icon.users />, t: "入居者管理", d: "個人情報・連絡先・保証人情報・契約履歴・支払履歴をまとめて。退去後の履歴も残せます。" },
    { i: <Icon.contract />, t: "契約管理", d: "作成から更新・解約までライフサイクル全体をカバー。30日前に更新漏れアラート。" },
    { i: <Icon.chart />, t: "ダッシュボード", d: "稼働率・回収率・空室数・滞納件数をリアルタイムで。月次推移グラフで傾向を把握。" },
    { i: <Icon.bell />, t: "通知", d: "滞納発生・契約満了・修繕依頼をメールとアプリ内通知でお知らせ。見落とし防止。" },
    { i: <Icon.shield />, t: "権限管理", d: "管理者・マネージャー・スタッフ・閲覧者の4ロール。操作権限をきめ細かく制御。" },
    { i: <Icon.send />, t: "CSV / PDF", d: "全データのCSV出力に対応。オーナー向け月次報告書PDFも自動生成。" },
  ];
  return (
    <section style={{ background: "var(--surface-tint)" }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">More Features</span>
          <h2>もっと、<em>細部まで</em>。</h2>
          <p>毎日の業務を支える、地味で大事な機能たち。</p>
        </div>
        <Reveal className="feat-grid">
          {items.map((it) => (
            <div key={it.t} className="feat-card">
              <div className="feat-glyph">{it.i}</div>
              <h4>{it.t}</h4>
              <p>{it.d}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ============ 3 steps ============ */
function Steps() {
  const items = [
    { t: "無料登録", d: "メールアドレスだけで、5分でアカウント作成。クレジットカード不要。" },
    { t: "物件登録", d: "物件・部屋の情報を入力。CSVインポートにも対応しているので一括登録もOK。" },
    { t: "運用開始", d: "すぐに使い始められます。困ったらメールサポートがすぐに返信。" },
  ];
  return (
    <section>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">3 Steps</span>
          <h2>たった<em>3ステップ</em>で<br/>はじめられます。</h2>
        </div>
        <Reveal className="steps">
          {items.map((s, i) => (
            <div key={s.t} className="step">
              <div className="step-num">0{i + 1}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Pricing ============ */
function Pricing() {
  const tiers = [
    ["〜10区画", "無料", true],
    ["〜50区画", "¥5,000 / 月"],
    ["〜100区画", "¥10,000 / 月"],
    ["〜300区画", "¥15,000 / 月"],
    ["〜500区画", "¥20,000 / 月"],
    ["〜1,000区画", "¥25,000 / 月"],
    ["〜2,000区画", "¥30,000 / 月"],
    ["2,001区画〜", "1,000区画ごとに +¥5,000"],
  ];
  return (
    <section id="pricing" style={{ background: "var(--surface-tint)" }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Pricing</span>
          <h2>区画数で決まる、<em>シンプル料金</em>。</h2>
          <p>10区画まで完全無料。全プランで全機能が使えます。</p>
        </div>
        <Reveal className="pricing-wrap">
          <div className="pricing-head">
            <span className="eyebrow">All-in-one plan</span>
            <h3>すべての機能。<br/><em>一つの料金で。</em></h3>
            <p>機能制限なし。区画数に応じてフェアな価格で。いつでも解約できて違約金もありません。</p>
            <ul className="pricing-feats">
              {["初期費用なし", "全機能利用可能", "クレジットカード不要で開始", "メールサポート付き", "いつでも解約・違約金なし"].map((x) => (
                <li key={x}><Icon.check style={{ color: "var(--accent-deep)" }} /> {x}</li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="#start">無料で始める <Icon.arrow /></a>
              <a className="btn btn-ghost" href="#demo">デモ環境を試す</a>
            </div>
          </div>
          <div className="tier-table">
            {tiers.map(([k, v, free]) => (
              <div key={k} className={`tier-row ${free ? "is-free" : ""}`}>
                <span>{k}</span>
                <span className={`price ${free ? "free" : ""}`}>{v}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Quote / story ============ */
function Quote() {
  return (
    <section id="stories">
      <div className="container">
        <Reveal className="quote">
          <q>Excelとメールで回していた頃に戻れない。月末の送金確定が3日仕事から30分になりました。</q>
          <div className="quote-meta">
            <div className="quote-avatar">山</div>
            <div>
              <div className="quote-name">山本 拓也 さん</div>
              <div className="quote-role">山本不動産 代表 · 管理戸数 280戸</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Columns ============ */
function Columns() {
  const items = [
    { cat: "業務改善", t: "Excel管理の限界——10物件を超えたら考えたい乗り換えの基準", d: "2026.05.10" },
    { cat: "賃貸経営", t: "「家賃滞納ゼロ」の管理会社が、実は半分のオーナーを失っている話", d: "2026.05.22" },
    { cat: "テナント対応", t: "騒音クレームの45dB vs 65dB——数字より大事な聞き方", d: "2026.05.10" },
  ];
  return (
    <section id="column">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Column</span>
          <h2>賃貸管理の<em>現場から</em>。</h2>
          <p>業務改善・賃貸経営・テナント対応——実務に役立つ情報をお届けします。</p>
        </div>
        <Reveal className="columns">
          {items.map((c) => (
            <a key={c.t} className="col-card" href="#">
              <span className="col-cat">{c.cat}</span>
              <h4 className="col-title">{c.t}</h4>
              <span className="col-date">{c.d}</span>
            </a>
          ))}
        </Reveal>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <a className="btn btn-ghost" href="#">コラム一覧を見る <Icon.arrow /></a>
        </div>
      </div>
    </section>
  );
}

/* ============ Final CTA ============ */
function FinalCTA() {
  return (
    <section id="contact">
      <div className="container">
        <Reveal className="cta-wrap">
          <div className="cta-bg" />
          <div style={{ position: "relative" }}>
            <h2>賃貸管理を、<br /><em>今日から変える。</em></h2>
            <p>10区画まで完全無料。クレジットカード不要、最短5分で始められます。</p>
            <div style={{ display: "inline-flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
              <a className="btn btn-primary btn-lg" href="#start">無料で始める <Icon.arrow /></a>
              <a className="btn btn-ghost btn-lg" href="#demo">お問い合わせ</a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Footer ============ */
function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <a href="#top" className="nav-logo" style={{ marginBottom: 12 }}>
              <span className="nav-logo-mark">R</span>
              <span>Roomly</span>
            </a>
            <p style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 28 + "ch", lineHeight: 1.6 }}>
              賃貸管理会社向けSaaS。物件・入居者・契約・家賃・修繕・送金を一つの画面で。
            </p>
          </div>
          <div className="footer-col">
            <h5>Product</h5>
            <a href="#features">機能</a>
            <a href="#pricing">料金</a>
            <a href="#demo">デモを試す</a>
            <a href="#">変更履歴</a>
          </div>
          <div className="footer-col">
            <h5>Resources</h5>
            <a href="#column">コラム</a>
            <a href="#stories">導入事例</a>
            <a href="#">よくある質問</a>
            <a href="#">移行ガイド</a>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <a href="#">運営会社</a>
            <a href="#contact">お問い合わせ</a>
            <a href="#">プライバシー</a>
            <a href="#">利用規約</a>
          </div>
        </div>
        <div className="footer-base">
          <span>© 2026 Roomly Inc.</span>
          <span className="mono">Made in Tokyo</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  FeatureRows, MockProperties, MockRent, MockRemit,
  FeatureGrid, Steps, Pricing, Quote, Columns, FinalCTA, Footer,
});
