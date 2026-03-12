import { ImageResponse } from "next/og";
import { getArticle, getAllSlugs } from "@/lib/media";

export const alt = "Roomly コラム";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);

  const title = article?.title ?? "Roomly コラム";
  const category = article?.category ?? "";
  const date = article?.date
    ? new Date(article.date).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const fontData = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600&display=swap"
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
          backgroundColor: "#1a365d",
          padding: "60px 80px",
        }}
      >
        {/* 左上: Roomly コラム */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.5)",
            fontFamily: "Noto Sans JP",
          }}
        >
          Roomly コラム
        </div>

        {/* 中央: 記事タイトル */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: title.length > 40 ? 36 : 44,
              fontWeight: 600,
              color: "#ffffff",
              fontFamily: "Noto Sans JP",
              lineHeight: 1.4,
              textAlign: "center",
              maxWidth: "1000px",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
        </div>

        {/* 下部: カテゴリ・日付 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.5)",
            fontFamily: "Noto Sans JP",
          }}
        >
          <div>{category}</div>
          <div>{date}</div>
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
