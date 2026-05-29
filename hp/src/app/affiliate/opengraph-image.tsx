import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Roomly アフィリエイトプログラム — 月額10% × 期限なし";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontData = readFileSync(
    join(process.cwd(), "src/assets/fonts/NotoSansJP-SemiBold.ttf")
  );

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
          fontFamily: "Noto Sans JP",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 56,
            left: 64,
            fontSize: 22,
            color: "rgba(255, 255, 255, 0.55)",
            letterSpacing: "0.12em",
          }}
        >
          ROOMLY AFFILIATE PROGRAM
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: 28,
          }}
        >
          紹介した方が続く限り、ずっと還元
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 28,
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 104,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            <span>月額の</span>
            <span style={{ color: "#7fb4ff" }}>10%</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            ×
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              fontWeight: 600,
              lineHeight: 1,
              color: "#7fb4ff",
            }}
          >
            期限なし
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 26,
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          紹介された会社が利用を続ける限り、毎月ずっと
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 48,
            right: 64,
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          hp.roomly.jp/affiliate
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
