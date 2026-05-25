import { NextRequest, NextResponse } from "next/server";

// 郵便番号→住所の検索API
// zipcloud（無料・登録不要）をサーバー側で呼び出す。
// クライアントから直接叩かず本ルート経由にすることで、
// 将来のプロバイダ差し替え・キャッシュ・レート制御を一元化できる。
//
// 使い方: GET /api/postal-code?code=1600023
// レスポンス: { prefecture, city, town, address } または { error }

interface ZipcloudResult {
  zipcode: string;
  prefcode: string;
  address1: string; // 都道府県
  address2: string; // 市区町村
  address3: string; // 町域
  kana1: string;
  kana2: string;
  kana3: string;
}

interface ZipcloudResponse {
  status: number;
  message: string | null;
  results: ZipcloudResult[] | null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("code") ?? "";
  // ハイフン・全角・空白を除去して7桁の数字に正規化
  const code = raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");

  if (code.length !== 7) {
    return NextResponse.json(
      { error: "郵便番号は7桁で入力してください" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`,
      // 同じ郵便番号は変わらないので長めにキャッシュ
      { next: { revalidate: 60 * 60 * 24 * 30 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "住所検索サービスに接続できませんでした" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as ZipcloudResponse;

    if (data.status !== 200) {
      return NextResponse.json(
        { error: data.message ?? "住所の取得に失敗しました" },
        { status: 502 }
      );
    }

    const hit = data.results?.[0];
    if (!hit) {
      return NextResponse.json(
        { error: "該当する住所が見つかりませんでした" },
        { status: 404 }
      );
    }

    const prefecture = hit.address1;
    const city = hit.address2;
    const town = hit.address3;

    return NextResponse.json({
      prefecture,
      city,
      town,
      // 都道府県＋市区町村＋町域を連結した住所（番地は利用者が追記）
      address: `${prefecture}${city}${town}`,
    });
  } catch {
    return NextResponse.json(
      { error: "住所検索サービスに接続できませんでした" },
      { status: 502 }
    );
  }
}
