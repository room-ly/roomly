/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

/* ============ Icons (inline SVG, originals) ============ */
const Icon = {
  building: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="4" y="3" width="10" height="18" rx="1.2" />
      <rect x="14" y="9" width="6" height="12" rx="1.2" />
      <path d="M7 7h.01M11 7h.01M7 11h.01M11 11h.01M7 15h.01M11 15h.01M17 13h.01M17 17h.01" strokeLinecap="round" />
    </svg>
  ),
  contract: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4M9 12h7M9 16h5M9 8h3" strokeLinecap="round" />
    </svg>
  ),
  cash: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10v.01M18 14v.01" strokeLinecap="round" />
    </svg>
  ),
  wrench: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-1.7-.3-.3-1.7z" strokeLinejoin="round" />
    </svg>
  ),
  send: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M4 12l16-8-4 16-4-6-8-2z" strokeLinejoin="round" />
    </svg>
  ),
  chart: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M4 20V8M10 20V4M16 20v-8M22 20H2" strokeLinecap="round" />
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.7" strokeLinecap="round" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M6 16V10a6 6 0 0 1 12 0v6l2 2H4z" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" strokeLinejoin="round" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  sun: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  ),
  moon: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" strokeLinejoin="round" />
    </svg>
  ),
};

/* ============ Reveal hook ============ */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, as = "div", className = "", ...rest }) {
  const ref = useReveal();
  const Tag = as;
  return <Tag ref={ref} className={`reveal ${className}`} {...rest}>{children}</Tag>;
}

/* ============ Nav ============ */
function Nav({ theme, setTheme }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container nav-inner">
        <a href="#top" className="nav-logo">
          <span className="nav-logo-mark">R</span>
          <span>Roomly</span>
        </a>
        <div className="nav-links">
          <a className="nav-link" href="#features">機能</a>
          <a className="nav-link" href="#pricing">料金</a>
          <a className="nav-link" href="#stories">導入事例</a>
          <a className="nav-link" href="#column">コラム</a>
          <a className="nav-link" href="#contact">お問い合わせ</a>
        </div>
        <div className="nav-cta">
          <button
            className="btn btn-ghost"
            aria-label="テーマ切り替え"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{ height: 36, width: 36, padding: 0, justifyContent: "center" }}
          >
            {theme === "dark" ? <Icon.sun /> : <Icon.moon />}
          </button>
          <a className="btn btn-ghost" href="#demo">ログイン</a>
          <a className="btn btn-primary" href="#start">無料で始める</a>
        </div>
      </div>
    </nav>
  );
}

/* ============ Hero ============ */
function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-grid">
        <div>
          <span className="eyebrow">SaaS for Property Management</span>
          <h1>
            賃貸管理を、<br />
            <span className="accent-word">もっと、</span><br />
            シンプルに。
          </h1>
          <p className="lede">
            物件・入居者・契約・家賃・修繕・送金——
            すべてを一つの画面で。Excelとメールから卒業する、
            最小で十分なSaaS。
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary btn-lg" href="#start">
              無料で始める <Icon.arrow />
            </a>
            <a className="btn btn-ghost btn-lg" href="#demo">
              デモを試す
            </a>
          </div>
          <div className="hero-trust">
            <span><Icon.check style={{ color: "var(--accent-deep)" }} /> 10区画まで無料</span>
            <span><Icon.check style={{ color: "var(--accent-deep)" }} /> クレカ不要</span>
            <span><Icon.check style={{ color: "var(--accent-deep)" }} /> 最短5分</span>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden>
      {/* Big anchor card - dashboard mock */}
      <div className="tile" style={{
        position: "absolute", top: 20, left: 0, width: "78%", padding: 0, overflow: "hidden",
        transform: "rotate(-1.2deg)"
      }}>
        <div className="frame-head">
          <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
          <span className="frame-title">roomly.jp / dashboard</span>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>
            稼働率
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 44, lineHeight: 1, fontWeight: 400, color: "var(--ink)" }}>96.4</span>
            <span style={{ fontSize: 14, color: "var(--ink-3)" }}>%</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent-deep)", background: "var(--accent-tint)", padding: "2px 8px", borderRadius: 999 }}>+2.1</span>
          </div>
          <svg viewBox="0 0 240 60" width="100%" height="60" style={{ marginTop: 12 }}>
            <defs>
              <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity=".35" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,42 L20,38 L40,40 L60,32 L80,30 L100,24 L120,28 L140,18 L160,22 L180,12 L200,16 L220,8 L240,12 L240,60 L0,60 Z" fill="url(#hg)" />
            <path d="M0,42 L20,38 L40,40 L60,32 L80,30 L100,24 L120,28 L140,18 L160,22 L180,12 L200,16 L220,8 L240,12" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            {[["稼働", "412/427"], ["滞納", "3件"], ["契約満了", "8件"]].map(([k, v]) => (
              <div key={k} style={{ padding: "8px 10px", background: "var(--surface-tint)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating tile: rent paid */}
      <div className="tile" style={{
        top: 0, right: 0, width: 200, transform: "rotate(2.5deg)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent-tint)", color: "var(--accent-deep)", display: "grid", placeItems: "center" }}>
            <Icon.cash />
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>家賃入金</div>
        </div>
        <div className="tile-value">¥78,000</div>
        <div className="tile-sub">301号室 · 山田 様</div>
      </div>

      {/* Floating tile: maintenance */}
      <div className="tile" style={{
        top: 250, right: 30, width: 220, transform: "rotate(-2deg)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#d97757" }} />
          <div className="tile-label" style={{ marginTop: 0 }}>修繕依頼 · 対応中</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>給湯器の不調</div>
        <div className="tile-sub">グランド青山 · 1204号</div>
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {["受付", "見積", "施工", "完了"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: i < 2 ? "var(--accent)" : "var(--line)" }} />
          ))}
        </div>
      </div>

      {/* Floating tile: owner remittance */}
      <div className="tile" style={{
        bottom: 0, left: 60, width: 230, transform: "rotate(1.5deg)"
      }}>
        <div className="tile-label">オーナー送金 · 5月分</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>¥2,847,500</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: "var(--ink-3)" }}>
          <span>承認済 · 12件</span>
          <span style={{ color: "var(--accent-deep)" }}>送金準備完了 →</span>
        </div>
      </div>
    </div>
  );
}

/* ============ Stats ============ */
function Stats() {
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="stats">
          <div className="stat">
            <div className="stat-num">¥0<small>初期</small></div>
            <div className="stat-label">導入コスト。クレカ不要で今日から使えます。</div>
          </div>
          <div className="stat">
            <div className="stat-num">10<small>区画</small></div>
            <div className="stat-label">までずっと無料。小規模管理にも安心。</div>
          </div>
          <div className="stat">
            <div className="stat-num">5<small>分</small></div>
            <div className="stat-label">登録から運用開始まで。Excelより速い。</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

Object.assign(window, { Icon, Reveal, Nav, Hero, Stats });
