import { useEffect, useRef, useState } from "react";

const APP_URL = "https://roomly.jp";
const HP_URL = "https://hp.roomly.jp";
const CONTACT_API = `${HP_URL}/api/contact`;

function App() {
  const fadeRefs = useRef<(HTMLElement | null)[]>([]);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    fadeRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const setFadeRef = (index: number) => (el: HTMLElement | null) => {
    fadeRefs.current[index] = el;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus("sending");
    try {
      const res = await fetch(CONTACT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactForm,
          type: "LPからのお問い合わせ",
        }),
      });
      if (!res.ok) throw new Error();
      setContactStatus("sent");
      setContactForm({ name: "", email: "", company: "", message: "" });
    } catch {
      setContactStatus("error");
    }
  };

  return (
    <>
      {/* ヘッダー */}
      <header className="header">
        <div className="container">
          <a href="#" className="header-logo">
            Roomly
          </a>
          <a href={APP_URL} className="btn-header">
            無料で始める
          </a>
        </div>
      </header>

      {/* ファーストビュー */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-catch">
            Excelでの物件管理、
            <br />
            そろそろ卒業しませんか？
          </h1>
          <p className="hero-sub">
            Roomlyなら、物件・契約・家賃・修繕をひとつの画面で管理できます。
            <br />
            10区画まで無料。
          </p>
          <a href={APP_URL} className="btn-cta">
            無料で始める
          </a>
          <p className="hero-note">
            クレジットカード不要・最短30秒で開始
          </p>
        </div>
      </section>

      {/* 課題セクション */}
      <section className="section" ref={setFadeRef(0)}>
        <div className="container fade-in" ref={setFadeRef(1)}>
          <h2 className="section-title">こんなお悩みありませんか？</h2>
          <div className="problems-grid">
            <div className="problem-card">
              <p>
                物件情報がExcelやファイルに散らばっていて、探すのに時間がかかる
              </p>
            </div>
            <div className="problem-card">
              <p>
                家賃の入金確認に毎月時間がかかり、滞納の把握が遅れてしまう
              </p>
            </div>
            <div className="problem-card">
              <p>
                オーナーへの送金明細を手作業で作っていて、ミスが心配
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section className="section section-alt" ref={setFadeRef(2)}>
        <div className="container fade-in" ref={setFadeRef(3)}>
          <h2 className="section-title">Roomlyなら解決できます</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-card-title">
                物件も入居者も、ひとつの画面で
              </h3>
              <p className="feature-card-desc">
                建物・部屋・契約の情報をまとめて管理。必要な情報にすぐアクセスできます。
              </p>
            </div>
            <div className="feature-card">
              <h3 className="feature-card-title">
                家賃の入金状況がひと目でわかる
              </h3>
              <p className="feature-card-desc">
                請求・入金・滞納をリアルタイムに追跡。確認作業の手間を減らせます。
              </p>
            </div>
            <div className="feature-card">
              <h3 className="feature-card-title">
                オーナー送金も自動で
              </h3>
              <p className="feature-card-desc">
                月次精算・管理費差引・送金明細を自動生成。手作業のミスを防ぎます。
              </p>
            </div>
            <div className="feature-card">
              <h3 className="feature-card-title">
                修繕もクレームも記録に残る
              </h3>
              <p className="feature-card-desc">
                依頼受付から完了までの対応履歴を管理。過去の対応もすぐに振り返れます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 料金セクション */}
      <section className="section" ref={setFadeRef(4)}>
        <div className="container fade-in" ref={setFadeRef(5)}>
          <h2 className="section-title">料金</h2>
          <div className="pricing-grid">
            <div className="pricing-card pricing-card-featured">
              <p className="pricing-plan">フリー</p>
              <p className="pricing-price">
                ¥0<span>/月</span>
              </p>
              <p className="pricing-desc">
                10区画まで無料。基本機能すべて使えます。
                <br />
                小規模な管理会社や、まず試してみたい方に。
              </p>
            </div>
            <div className="pricing-card">
              <p className="pricing-plan">スタンダード</p>
              <p className="pricing-price">
                ¥5,000〜<span>/月</span>
              </p>
              <p className="pricing-desc">
                11区画から区画数に応じた従量課金。
                <br />
                11〜50区画 ¥5,000/月、51〜100区画 ¥10,000/月〜
              </p>
            </div>
          </div>
          <div className="pricing-cta">
            <a href={APP_URL} className="btn-cta-accent">
              まずは無料で試してみる
            </a>
          </div>
        </div>
      </section>

      {/* お問い合わせフォーム */}
      <section className="section section-alt" id="contact" ref={setFadeRef(6)}>
        <div className="container fade-in" ref={setFadeRef(7)}>
          <h2 className="section-title">お問い合わせ・資料請求</h2>
          {contactStatus === "sent" ? (
            <div className="contact-done">
              <p className="contact-done-title">送信しました</p>
              <p className="contact-done-desc">
                お問い合わせありがとうございます。担当者より折り返しご連絡いたします。
              </p>
              <button
                className="btn-cta-accent"
                onClick={() => setContactStatus("idle")}
              >
                続けてお問い合わせする
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    お名前 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>会社名</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        company: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  メールアドレス <span className="required">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  お問い合わせ内容 <span className="required">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                />
              </div>
              {contactStatus === "error" && (
                <p className="form-error">
                  送信に失敗しました。時間をおいて再度お試しください。
                </p>
              )}
              <button
                type="submit"
                className="btn-cta-accent btn-submit"
                disabled={contactStatus === "sending"}
              >
                {contactStatus === "sending" ? "送信中..." : "送信する"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* フッター */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <a href={HP_URL}>サービス詳細</a>
          </div>
          <p>&copy; 2025 Roomly</p>
        </div>
      </footer>
    </>
  );
}

export default App;
