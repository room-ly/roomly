import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-Y2943F8G2J";
const AW_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";

export default function GoogleAnalytics() {
  if (!GA_ID && !AW_ID) return null;

  const configs = [
    GA_ID ? `gtag('config', '${GA_ID}');` : "",
    AW_ID ? `gtag('config', '${AW_ID}');` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // gtag.jsのsrcはどちらか1つのIDで読み込めばよい（GA優先）
  const loaderId = GA_ID || AW_ID;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${configs}
        `}
      </Script>
    </>
  );
}
