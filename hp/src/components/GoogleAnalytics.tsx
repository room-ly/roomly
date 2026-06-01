import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-Y2943F8G2J";

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // hp.roomly.jp ⇄ kanri.roomly.jp のサブドメイン間でセッション・流入元を引き継ぐ。
          // cookie_domain を親ドメインに固定し、linker で _gl パラメータを相互に受け渡す。
          gtag('config', '${GA_ID}', {
            cookie_domain: '.roomly.jp',
            linker: {
              domains: ['hp.roomly.jp', 'kanri.roomly.jp'],
              accept_incoming: true,
            },
          });
        `}
      </Script>
    </>
  );
}
