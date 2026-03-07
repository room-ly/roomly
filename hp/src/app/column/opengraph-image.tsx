import { ImageResponse } from "next/og";

export const alt = "コラム — Roomly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontData = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@600&display=swap"
  )
    .then((res) => res.text())
    .then((css) => {
      const match = css.match(/src: url\(([^)]+)\)/);
      if (!match) throw new Error("Font URL not found");
      return fetch(match[1]);
    })
    .then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a365d",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: "Noto Sans JP",
          }}
        >
          コラム
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: 24,
            fontFamily: "Noto Sans JP",
          }}
        >
          賃貸管理の業務改善に役立つ情報
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
