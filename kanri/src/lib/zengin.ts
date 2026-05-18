// 全銀フォーマット（固定長120バイト）の総合振込データ生成
// 参考: 全国銀行協会「全銀協規定フォーマット」
// 全てのフィールドは半角（1バイト/文字）で、行は正確に120バイト

interface ZenginTransferRecord {
  bankCode: string;        // 振込先銀行コード（4桁）
  branchCode: string;      // 振込先支店コード（3桁）
  accountType: string;     // 預金種目: 1=普通, 2=当座
  accountNumber: string;   // 口座番号（7桁）
  accountHolder: string;   // 受取人名（カナ30文字）
  amount: number;          // 振込金額
}

interface ZenginHeader {
  transferDate: string;        // 振込日 MMDD
  senderBankCode: string;      // 依頼人銀行コード（4桁）
  senderBranchCode: string;    // 依頼人支店コード（3桁）
  senderAccountType: string;   // 依頼人預金種目
  senderAccountNumber: string; // 依頼人口座番号（7桁）
  senderName: string;          // 依頼人名（カナ40文字）
}

const KANA_MAP: Record<string, string> = {
  ア:"ｱ",イ:"ｲ",ウ:"ｳ",エ:"ｴ",オ:"ｵ",カ:"ｶ",キ:"ｷ",ク:"ｸ",ケ:"ｹ",コ:"ｺ",
  サ:"ｻ",シ:"ｼ",ス:"ｽ",セ:"ｾ",ソ:"ｿ",タ:"ﾀ",チ:"ﾁ",ツ:"ﾂ",テ:"ﾃ",ト:"ﾄ",
  ナ:"ﾅ",ニ:"ﾆ",ヌ:"ﾇ",ネ:"ﾈ",ノ:"ﾉ",ハ:"ﾊ",ヒ:"ﾋ",フ:"ﾌ",ヘ:"ﾍ",ホ:"ﾎ",
  マ:"ﾏ",ミ:"ﾐ",ム:"ﾑ",メ:"ﾒ",モ:"ﾓ",ヤ:"ﾔ",ユ:"ﾕ",ヨ:"ﾖ",
  ラ:"ﾗ",リ:"ﾘ",ル:"ﾙ",レ:"ﾚ",ロ:"ﾛ",ワ:"ﾜ",ヲ:"ｦ",ン:"ﾝ",
  ァ:"ｧ",ィ:"ｨ",ゥ:"ｩ",ェ:"ｪ",ォ:"ｫ",ッ:"ｯ",ャ:"ｬ",ュ:"ｭ",ョ:"ｮ",
  ガ:"ｶﾞ",ギ:"ｷﾞ",グ:"ｸﾞ",ゲ:"ｹﾞ",ゴ:"ｺﾞ",ザ:"ｻﾞ",ジ:"ｼﾞ",ズ:"ｽﾞ",ゼ:"ｾﾞ",ゾ:"ｿﾞ",
  ダ:"ﾀﾞ",ヂ:"ﾁﾞ",ヅ:"ﾂﾞ",デ:"ﾃﾞ",ド:"ﾄﾞ",バ:"ﾊﾞ",ビ:"ﾋﾞ",ブ:"ﾌﾞ",ベ:"ﾍﾞ",ボ:"ﾎﾞ",
  パ:"ﾊﾟ",ピ:"ﾋﾟ",プ:"ﾌﾟ",ペ:"ﾍﾟ",ポ:"ﾎﾟ",ヴ:"ｳﾞ",
  ー:"-","「":"｢","」":"｣","。":".","、":",","・":"･",
};

// 全角カタカナ・ひらがな → 半角カナ変換
function toHalfWidthKana(str: string): string {
  let s = str.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
  s = s.replace(/[ァ-ヴー「」。、・]/g, (c) => KANA_MAP[c] || c);
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  s = s.replace(/　/g, " ");
  return s;
}

// 右スペース埋め（指定バイト数）
function padRight(str: string, len: number): string {
  const s = str.length > len ? str.slice(0, len) : str;
  return s + " ".repeat(len - s.length);
}

// 左ゼロ埋め（指定バイト数）
function padLeft(str: string, len: number, char = "0"): string {
  const s = str.length > len ? str.slice(0, len) : str;
  return char.repeat(len - s.length) + s;
}

function accountTypeCode(type: string): string {
  if (type === "current" || type === "当座") return "2";
  return "1"; // ordinary / 普通
}

// ヘッダーレコード（120バイト固定）
export function generateZenginHeader(header: ZenginHeader): string {
  const senderName = toHalfWidthKana(header.senderName);
  const parts: string[] = [];
  parts.push("1");                                       //   1 ( 1) データ区分
  parts.push("21");                                      //   2 ( 2) 種別コード
  parts.push("0");                                       //   4 ( 1) コード区分
  parts.push(padRight("", 10));                          //   5 (10) 委託者コード
  parts.push(padRight(senderName, 40));                  //  15 (40) 委託者名
  parts.push(header.transferDate.slice(0, 4));           //  55 ( 4) 振込指定日
  parts.push(padLeft(header.senderBankCode, 4));         //  59 ( 4) 仕向銀行番号
  parts.push(padRight("", 15));                          //  63 (15) 仕向銀行名
  parts.push(padLeft(header.senderBranchCode, 3));       //  78 ( 3) 仕向支店番号
  parts.push(padRight("", 15));                          //  81 (15) 仕向支店名
  parts.push(accountTypeCode(header.senderAccountType)); //  96 ( 1) 預金種目
  parts.push(padLeft(header.senderAccountNumber, 7));    //  97 ( 7) 口座番号
  parts.push(padRight("", 17));                          // 104 (17) ダミー
  const record = parts.join("");
  return record.slice(0, 120);
}

// データレコード（120バイト固定）
export function generateZenginData(transfer: ZenginTransferRecord): string {
  const holder = toHalfWidthKana(transfer.accountHolder);
  const parts: string[] = [];
  parts.push("2");                                       //   1 ( 1) データ区分
  parts.push(padLeft(transfer.bankCode, 4));             //   2 ( 4) 銀行番号
  parts.push(padRight("", 15));                          //   6 (15) 銀行名
  parts.push(padLeft(transfer.branchCode, 3));           //  21 ( 3) 支店番号
  parts.push(padRight("", 15));                          //  24 (15) 支店名
  parts.push("0000");                                    //  39 ( 4) 手形交換所番号
  parts.push(accountTypeCode(transfer.accountType));     //  43 ( 1) 預金種目
  parts.push(padLeft(transfer.accountNumber, 7));        //  44 ( 7) 口座番号
  parts.push(padRight(holder, 30));                      //  51 (30) 受取人名
  parts.push(padLeft(String(Math.max(0, Math.round(transfer.amount))), 10)); // 81 (10) 振込金額
  parts.push("0");                                       //  91 ( 1) 新規コード
  parts.push(padRight("", 20));                          //  92 (20) 顧客コード1
  parts.push(padRight("", 8));                           // 112 ( 8) 顧客コード2
  parts.push(" ");                                       // 120 ( 1) EDI情報使用フラグ
  const record = parts.join("");
  return record.slice(0, 120);
}

// トレーラーレコード（120バイト固定）
export function generateZenginTrailer(totalCount: number, totalAmount: number): string {
  const parts: string[] = [];
  parts.push("8");                                       //   1 ( 1) データ区分
  parts.push(padLeft(String(totalCount), 6));            //   2 ( 6) 合計件数
  parts.push(padLeft(String(Math.round(totalAmount)), 12)); //  8 (12) 合計金額
  parts.push(padRight("", 101));                         //  20 (101) ダミー
  return parts.join("").slice(0, 120);
}

// エンドレコード（120バイト固定）
export function generateZenginEnd(): string {
  return "9" + " ".repeat(119);
}

// UTF-8の半角カナ文字列をShift_JIS（JIS X 0201カナ）バイト列に変換
// 全銀フォーマットで使う文字: ASCII(0x20-0x7E) + 半角カナ(0xFF61-0xFF9F → 0xA1-0xDF)
function toShiftJISBytes(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7F) {
      bytes.push(code);
    } else if (code >= 0xFF61 && code <= 0xFF9F) {
      bytes.push(code - 0xFF61 + 0xA1);
    } else {
      bytes.push(0x20);
    }
  }
  return new Uint8Array(bytes);
}

export function generateZenginFile(
  header: ZenginHeader,
  transfers: ZenginTransferRecord[]
): Uint8Array {
  const lines: string[] = [];
  lines.push(generateZenginHeader(header));
  let totalAmount = 0;
  for (const t of transfers) {
    lines.push(generateZenginData(t));
    totalAmount += Math.max(0, Math.round(t.amount));
  }
  lines.push(generateZenginTrailer(transfers.length, totalAmount));
  lines.push(generateZenginEnd());
  return toShiftJISBytes(lines.join("\r\n"));
}
