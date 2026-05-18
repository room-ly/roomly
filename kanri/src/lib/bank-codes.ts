// 日本の主要銀行コード一覧
// 参考: 全国銀行協会 統一金融機関コード

export const BANK_CODES = [
  // ===== メガバンク =====
  { code: "0001", name: "みずほ銀行", kana: "ミズホ" },
  { code: "0005", name: "三菱UFJ銀行", kana: "ミツビシユーエフジェイ" },
  { code: "0009", name: "三井住友銀行", kana: "ミツイスミトモ" },
  { code: "0010", name: "りそな銀行", kana: "リソナ" },
  { code: "0017", name: "埼玉りそな銀行", kana: "サイタマリソナ" },

  // ===== ゆうちょ銀行 =====
  { code: "9900", name: "ゆうちょ銀行", kana: "ユウチョ" },

  // ===== ネット銀行 =====
  { code: "0036", name: "楽天銀行", kana: "ラクテン" },
  { code: "0038", name: "住信SBIネット銀行", kana: "スミシンエスビーアイネット" },
  { code: "0033", name: "PayPay銀行", kana: "ペイペイ" },
  { code: "0039", name: "auじぶん銀行", kana: "エーユージブン" },
  { code: "0035", name: "ソニー銀行", kana: "ソニー" },
  { code: "0310", name: "GMOあおぞらネット銀行", kana: "ジーエムオーアオゾラネット" },
  { code: "0044", name: "UI銀行", kana: "ユーアイ" },
  { code: "0043", name: "みんなの銀行", kana: "ミンナノ" },
  { code: "0041", name: "大和ネクスト銀行", kana: "ダイワネクスト" },
  { code: "0034", name: "セブン銀行", kana: "セブン" },
  { code: "0040", name: "イオン銀行", kana: "イオン" },
  { code: "0042", name: "ローソン銀行", kana: "ローソン" },

  // ===== 信託銀行 =====
  { code: "0288", name: "三菱UFJ信託銀行", kana: "ミツビシユーエフジェイシンタク" },
  { code: "0294", name: "三井住友信託銀行", kana: "ミツイスミトモシンタク" },
  { code: "0289", name: "みずほ信託銀行", kana: "ミズホシンタク" },

  // ===== 主要地方銀行 =====
  { code: "0138", name: "横浜銀行", kana: "ヨコハマ" },
  { code: "0134", name: "千葉銀行", kana: "チバ" },
  { code: "0149", name: "静岡銀行", kana: "シズオカ" },
  { code: "0177", name: "福岡銀行", kana: "フクオカ" },
  { code: "0116", name: "北海道銀行", kana: "ホッカイドウ" },
  { code: "0130", name: "常陽銀行", kana: "ジョウヨウ" },
  { code: "0158", name: "京都銀行", kana: "キョウト" },
  { code: "0169", name: "広島銀行", kana: "ヒロシマ" },
  { code: "0144", name: "北陸銀行", kana: "ホクリク" },
  { code: "0128", name: "群馬銀行", kana: "グンマ" },
  { code: "0181", name: "十八親和銀行", kana: "ジュウハチシンワ" },
  { code: "0170", name: "山口銀行", kana: "ヤマグチ" },
  { code: "0174", name: "伊予銀行", kana: "イヨ" },
  { code: "0155", name: "百五銀行", kana: "ヒャクゴ" },
  { code: "0143", name: "八十二銀行", kana: "ハチジュウニ" },
  { code: "0125", name: "七十七銀行", kana: "シチジュウシチ" },
  { code: "0126", name: "東邦銀行", kana: "トウホウ" },
  { code: "0133", name: "武蔵野銀行", kana: "ムサシノ" },
  { code: "0137", name: "きらぼし銀行", kana: "キラボシ" },
  { code: "0159", name: "関西みらい銀行", kana: "カンサイミライ" },
  { code: "0161", name: "池田泉州銀行", kana: "イケダセンシュウ" },
  { code: "0162", name: "南都銀行", kana: "ナント" },
  { code: "0157", name: "滋賀銀行", kana: "シガ" },
  { code: "0163", name: "紀陽銀行", kana: "キヨウ" },
  { code: "0167", name: "山陰合同銀行", kana: "サンインゴウドウ" },
  { code: "0172", name: "阿波銀行", kana: "アワ" },
  { code: "0175", name: "四国銀行", kana: "シコク" },
  { code: "0183", name: "大分銀行", kana: "オオイタ" },
  { code: "0182", name: "肥後銀行", kana: "ヒゴ" },
  { code: "0185", name: "鹿児島銀行", kana: "カゴシマ" },
  { code: "0187", name: "琉球銀行", kana: "リュウキュウ" },
  { code: "0188", name: "沖縄銀行", kana: "オキナワ" },

  // ===== 主要信用金庫 =====
  { code: "1611", name: "京都中央信用金庫", kana: "キョウトチュウオウ" },
  { code: "1344", name: "城南信用金庫", kana: "ジョウナン" },
  { code: "1360", name: "多摩信用金庫", kana: "タマ" },
  { code: "1635", name: "大阪信用金庫", kana: "オオサカ" },
  { code: "1688", name: "尼崎信用金庫", kana: "アマガサキ" },

  // ===== その他 =====
  { code: "0397", name: "新生銀行", kana: "シンセイ" },
  { code: "0398", name: "あおぞら銀行", kana: "アオゾラ" },
  { code: "2004", name: "商工組合中央金庫", kana: "ショウコウクミアイチュウオウ" },
  { code: "3000", name: "農林中央金庫", kana: "ノウリンチュウオウ" },
] as const;

export type BankCode = (typeof BANK_CODES)[number];
