// 賃貸管理テンプレート（Excel / Word）を public/templates/ に生成するスクリプト。
// 実行: node scripts/generate-templates.mjs
// 生成物はリポジトリにコミットし、ページからは静的ファイルとして配信する（ランタイム依存ゼロ）。
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "templates");

const NAVY = "FF1A365D"; // ブランドprimary
const NAVY_LIGHT = "FFEAF0F7";
const GRAY = "FFF7FAFC";
const BORDER = "FFCBD5E0";

// 共通: ヘッダー行・罫線スタイル
const thinBorder = {
  top: { style: "thin", color: { argb: BORDER } },
  left: { style: "thin", color: { argb: BORDER } },
  bottom: { style: "thin", color: { argb: BORDER } },
  right: { style: "thin", color: { argb: BORDER } },
};

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder;
  });
  row.height = 28;
}

function applyBodyBorders(ws, startRow, endRow, colCount) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle", wrapText: true, ...cell.alignment };
      if ((r - startRow) % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
      }
    }
  }
}

function addCredit(ws, row, colSpan) {
  ws.mergeCells(row, 1, row, colSpan);
  const cell = ws.getCell(row, 1);
  cell.value = "本テンプレートは Roomly（hp.roomly.jp）が無料提供しています。自由に編集してご利用ください。";
  cell.font = { size: 9, color: { argb: "FF718096" }, italic: true };
  cell.alignment = { horizontal: "left" };
}

function addTitle(ws, title, colSpan) {
  ws.mergeCells(1, 1, 1, colSpan);
  const cell = ws.getCell(1, 1);
  cell.value = title;
  cell.font = { bold: true, size: 16, color: { argb: NAVY } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 32;
}

// ── 1. 物件・家賃管理表 ─────────────────────────────
async function buildRentLedger() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Roomly";
  const ws = wb.addWorksheet("家賃管理表", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  ws.columns = [
    { width: 12 }, // 部屋番号
    { width: 16 }, // 入居者名
    { width: 12 }, // 家賃
    { width: 10 }, // 管理費
    { width: 12 }, // 請求額
    { width: 12 }, // 入金日
    { width: 12 }, // 入金額
    { width: 10 }, // 状態
    { width: 24 }, // 備考
  ];

  addTitle(ws, "家賃管理表（月次）", 9);
  ws.mergeCells(2, 1, 2, 9);
  ws.getCell(2, 1).value = "対象月：　　　　年　　月";
  ws.getCell(2, 1).font = { size: 11, color: { argb: "FF4A5568" } };

  const headerRowIdx = 4;
  const headers = ["部屋番号", "入居者名", "家賃", "管理費", "請求額", "入金日", "入金額", "状態", "備考"];
  ws.getRow(headerRowIdx).values = headers;
  styleHeaderRow(ws.getRow(headerRowIdx));

  // データ行（請求額=家賃+管理費 を計算式で）
  const rows = 20;
  for (let i = 0; i < rows; i++) {
    const r = headerRowIdx + 1 + i;
    ws.getCell(r, 5).value = { formula: `IF(AND(C${r}="",D${r}=""),"",N(C${r})+N(D${r}))` };
    // 状態: 入金額 >= 請求額 なら「入金済」、それ以外で請求額ありなら「未納」
    ws.getCell(r, 8).value = {
      formula: `IF(E${r}="","",IF(N(G${r})>=E${r},"入金済",IF(G${r}="","未入金","一部入金")))`,
    };
    for (const c of [3, 4, 5, 7]) ws.getCell(r, c).numFmt = '#,##0"円"';
    ws.getCell(r, 6).numFmt = "yyyy/m/d";
  }
  applyBodyBorders(ws, headerRowIdx + 1, headerRowIdx + rows, 9);

  // 合計行
  const totalRow = headerRowIdx + rows + 1;
  ws.getCell(totalRow, 2).value = "合計";
  ws.getCell(totalRow, 2).font = { bold: true };
  ws.getCell(totalRow, 5).value = { formula: `SUM(E${headerRowIdx + 1}:E${headerRowIdx + rows})` };
  ws.getCell(totalRow, 7).value = { formula: `SUM(G${headerRowIdx + 1}:G${headerRowIdx + rows})` };
  for (const c of [5, 7]) {
    ws.getCell(totalRow, c).numFmt = '#,##0"円"';
    ws.getCell(totalRow, c).font = { bold: true };
    ws.getCell(totalRow, c).border = thinBorder;
  }
  ws.getCell(totalRow, 2).border = thinBorder;

  addCredit(ws, totalRow + 2, 9);

  await wb.xlsx.writeFile(join(OUT_DIR, "rent-ledger-template.xlsx"));
  console.log("✓ rent-ledger-template.xlsx");
}

// ── 2. 退去精算書（敷金精算書） ─────────────────────
async function buildMoveOutSettlement() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Roomly";
  const ws = wb.addWorksheet("退去精算書");

  ws.columns = [{ width: 28 }, { width: 18 }, { width: 18 }, { width: 24 }];

  addTitle(ws, "退去精算書（敷金精算書）", 4);

  // 物件情報ブロック
  const info = [
    ["物件名・部屋番号", ""],
    ["入居者氏名", ""],
    ["入居日", ""],
    ["退去日", ""],
    ["預り敷金", ""],
  ];
  let r = 3;
  for (const [label, val] of info) {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 1).font = { bold: true, color: { argb: NAVY } };
    ws.getCell(r, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
    ws.getCell(r, 1).border = thinBorder;
    ws.mergeCells(r, 2, r, 4);
    ws.getCell(r, 2).value = val;
    ws.getCell(r, 2).border = thinBorder;
    if (label === "預り敷金") ws.getCell(r, 2).numFmt = '#,##0"円"';
    r++;
  }

  // 控除明細
  r += 1;
  ws.getCell(r, 1).value = "控除明細（入居者負担分）";
  ws.getCell(r, 1).font = { bold: true, size: 12, color: { argb: NAVY } };
  r++;
  const dHeader = r;
  ws.getRow(dHeader).values = ["項目", "金額", "負担割合", "備考"];
  styleHeaderRow(ws.getRow(dHeader));
  const dRows = 8;
  for (let i = 0; i < dRows; i++) {
    const rr = dHeader + 1 + i;
    ws.getCell(rr, 2).numFmt = '#,##0"円"';
    ws.getCell(rr, 3).numFmt = '0"%"';
  }
  applyBodyBorders(ws, dHeader + 1, dHeader + dRows, 4);

  const deductTotalRow = dHeader + dRows + 1;
  ws.getCell(deductTotalRow, 1).value = "控除合計";
  ws.getCell(deductTotalRow, 1).font = { bold: true };
  ws.getCell(deductTotalRow, 2).value = { formula: `SUM(B${dHeader + 1}:B${dHeader + dRows})` };
  ws.getCell(deductTotalRow, 2).numFmt = '#,##0"円"';
  ws.getCell(deductTotalRow, 2).font = { bold: true };
  ws.getCell(deductTotalRow, 1).border = thinBorder;
  ws.getCell(deductTotalRow, 2).border = thinBorder;

  // 返還額
  const refundRow = deductTotalRow + 2;
  ws.getCell(refundRow, 1).value = "返還額（預り敷金 − 控除合計）";
  ws.getCell(refundRow, 1).font = { bold: true, size: 12, color: { argb: NAVY } };
  ws.getCell(refundRow, 2).value = { formula: `N(B7)-B${deductTotalRow}` };
  ws.getCell(refundRow, 2).numFmt = '#,##0"円"';
  ws.getCell(refundRow, 2).font = { bold: true, size: 12, color: { argb: NAVY } };
  ws.getCell(refundRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
  ws.getCell(refundRow, 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
  ws.getCell(refundRow, 1).border = thinBorder;
  ws.getCell(refundRow, 2).border = thinBorder;

  ws.mergeCells(refundRow + 2, 1, refundRow + 2, 4);
  ws.getCell(refundRow + 2, 1).value =
    "※ 通常損耗・経年変化は大家負担です（国土交通省「原状回復をめぐるトラブルとガイドライン」）。入居者負担は故意・過失による損耗に限られ、耐用年数に応じて按分されます。";
  ws.getCell(refundRow + 2, 1).font = { size: 9, color: { argb: "FF718096" } };
  ws.getCell(refundRow + 2, 1).alignment = { wrapText: true };

  addCredit(ws, refundRow + 4, 4);

  await wb.xlsx.writeFile(join(OUT_DIR, "move-out-settlement-template.xlsx"));
  console.log("✓ move-out-settlement-template.xlsx");
}

// ── 3. 原状回復 負担割合表 ─────────────────────────
async function buildRestorationBurdenSheet() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Roomly";

  // シート1: 耐用年数早見表（国交省ガイドライン）
  const ref = wb.addWorksheet("耐用年数早見表");
  ref.columns = [{ width: 26 }, { width: 14 }, { width: 40 }];
  addTitle(ref, "原状回復 耐用年数早見表（国交省ガイドライン）", 3);
  ref.getRow(3).values = ["対象", "耐用年数", "備考"];
  styleHeaderRow(ref.getRow(3));
  const refData = [
    ["壁紙（クロス）", "6年", "経過年数を考慮し残存価値1円まで按分"],
    ["クッションフロア", "6年", "同上"],
    ["カーペット", "6年", "同上"],
    ["畳表", "考慮しない", "消耗品扱い。汚損は基本入居者負担"],
    ["フローリング（部分補修）", "考慮しない", "部分補修は経過年数を考慮しない"],
    ["フローリング（全面張替）", "建物の耐用年数", "建物躯体の法定耐用年数に準じる"],
    ["流し台", "5年", "経過年数を考慮"],
    ["エアコン", "6年", "経過年数を考慮"],
    ["電気・ガス・水道設備", "15年", "経過年数を考慮"],
  ];
  refData.forEach((row, i) => {
    ref.getRow(4 + i).values = row;
  });
  applyBodyBorders(ref, 4, 3 + refData.length, 3);
  addCredit(ref, 3 + refData.length + 2, 3);

  // シート2: 負担割合 計算表
  const calc = wb.addWorksheet("負担割合 計算表");
  calc.columns = [
    { width: 22 }, // 対象
    { width: 12 }, // 補修費用
    { width: 12 }, // 耐用年数
    { width: 12 }, // 入居年数
    { width: 14 }, // 入居者負担率
    { width: 14 }, // 入居者負担額
    { width: 14 }, // 大家負担額
  ];
  addTitle(calc, "原状回復 負担割合 計算表", 7);
  calc.mergeCells(2, 1, 2, 7);
  calc.getCell(2, 1).value =
    "補修費用・耐用年数（年）・入居年数（年）を入力すると、残存価値を考慮した入居者負担額を自動計算します。耐用年数を0にすると経過年数を考慮しません（全額が対象）。";
  calc.getCell(2, 1).font = { size: 10, color: { argb: "FF4A5568" } };
  calc.getCell(2, 1).alignment = { wrapText: true };
  calc.getRow(2).height = 30;

  const ch = 4;
  calc.getRow(ch).values = ["対象", "補修費用", "耐用年数", "入居年数", "入居者負担率", "入居者負担額", "大家負担額"];
  styleHeaderRow(calc.getRow(ch));
  const cRows = 10;
  for (let i = 0; i < cRows; i++) {
    const rr = ch + 1 + i;
    // 負担率 = 残存価値割合 = MAX(0, (耐用年数 - 入居年数) / 耐用年数)。耐用年数0なら100%
    calc.getCell(rr, 5).value = {
      formula: `IF(B${rr}="","",IF(N(C${rr})<=0,1,MAX(0,(C${rr}-N(D${rr}))/C${rr})))`,
    };
    calc.getCell(rr, 6).value = { formula: `IF(B${rr}="","",ROUND(N(B${rr})*E${rr},0))` };
    calc.getCell(rr, 7).value = { formula: `IF(B${rr}="","",N(B${rr})-F${rr})` };
    calc.getCell(rr, 2).numFmt = '#,##0"円"';
    calc.getCell(rr, 5).numFmt = "0%";
    calc.getCell(rr, 6).numFmt = '#,##0"円"';
    calc.getCell(rr, 7).numFmt = '#,##0"円"';
  }
  applyBodyBorders(calc, ch + 1, ch + cRows, 7);

  const ctotal = ch + cRows + 1;
  calc.getCell(ctotal, 1).value = "合計";
  calc.getCell(ctotal, 1).font = { bold: true };
  calc.getCell(ctotal, 6).value = { formula: `SUM(F${ch + 1}:F${ch + cRows})` };
  calc.getCell(ctotal, 7).value = { formula: `SUM(G${ch + 1}:G${ch + cRows})` };
  for (const c of [6, 7]) {
    calc.getCell(ctotal, c).numFmt = '#,##0"円"';
    calc.getCell(ctotal, c).font = { bold: true };
    calc.getCell(ctotal, c).border = thinBorder;
  }
  calc.getCell(ctotal, 1).border = thinBorder;
  addCredit(calc, ctotal + 2, 7);

  await wb.xlsx.writeFile(join(OUT_DIR, "restoration-burden-template.xlsx"));
  console.log("✓ restoration-burden-template.xlsx");
}

// ── 4. 契約更新通知（Word） ───────────────────────
async function buildContractRenewalNotice() {
  const accent = "1A365D";
  const gray = "718096";
  const p = (children, opts = {}) =>
    new Paragraph({ spacing: { after: 160 }, children, ...opts });
  const run = (text, opts = {}) => new TextRun({ text, font: "Yu Gothic", size: 21, ...opts });

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
            children: [run("　　　　年　　月　　日", { color: gray })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            heading: HeadingLevel.HEADING_1,
            children: [run("賃貸借契約 更新のご案内", { bold: true, size: 32, color: accent })],
          }),
          p([run("　　　　　　　　　　　様")]),
          p([run("いつも当物件をご利用いただきありがとうございます。")]),
          p([
            run(
              "下記賃貸借契約につきまして、契約期間満了に伴う更新の時期が近づいてまいりましたので、ご案内申し上げます。更新をご希望の場合は、下記内容をご確認のうえ、期日までにご返送くださいますようお願いいたします。"
            ),
          ]),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 160 },
            children: [run("記", { bold: true })],
          }),
          ...[
            ["物件名・部屋番号", "　"],
            ["現在の契約期間", "　　　　年　　月　　日 ～ 　　　　年　　月　　日"],
            ["新しい契約期間", "　　　　年　　月　　日 ～ 　　　　年　　月　　日"],
            ["契約更新後の家賃（税込）", "月額　　　　　　円"],
            ["更新料（税込）", "　　　　　　円"],
            ["更新事務手数料（税込）", "　　　　　　円"],
            ["ご返送期日", "　　　　年　　月　　日"],
          ].map(
            ([k, v]) =>
              new Paragraph({
                spacing: { after: 120 },
                children: [run("● " + k + "：", { bold: true }), run(v)],
              })
          ),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 200 },
            children: [run("以上", { bold: true })],
          }),
          p([
            run(
              "ご不明な点がございましたら、下記までお気軽にお問い合わせください。引き続きどうぞよろしくお願い申し上げます。"
            ),
          ]),
          new Paragraph({
            spacing: { before: 320 },
            alignment: AlignmentType.RIGHT,
            children: [run("管理会社名：　　　　　　　　　　", { color: accent })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [run("担当：　　　　　　　TEL：　　　　　　　　　", { color: accent })],
          }),
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: "本テンプレートは Roomly（hp.roomly.jp）が無料提供しています。",
                font: "Yu Gothic",
                size: 16,
                italics: true,
                color: gray,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await writeFile(join(OUT_DIR, "contract-renewal-notice-template.docx"), buffer);
  console.log("✓ contract-renewal-notice-template.docx");
}

// ── 5. オーナー送金明細書 ─────────────────────────
async function buildOwnerRemittanceStatement() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Roomly";
  const ws = wb.addWorksheet("送金明細書");

  ws.columns = [{ width: 26 }, { width: 16 }, { width: 16 }, { width: 28 }];

  addTitle(ws, "オーナー様 送金明細書", 4);
  ws.mergeCells(2, 1, 2, 4);
  ws.getCell(2, 1).value = "対象月：　　　　年　　月分　／　オーナー名：　　　　　　　　様";
  ws.getCell(2, 1).font = { size: 11, color: { argb: "FF4A5568" } };

  // 入金（収入）ブロック
  let r = 4;
  ws.getCell(r, 1).value = "■ 入金（家賃・共益費など）";
  ws.getCell(r, 1).font = { bold: true, size: 12, color: { argb: NAVY } };
  r++;
  const inHeader = r;
  ws.getRow(inHeader).values = ["項目", "金額", "", "備考"];
  styleHeaderRow(ws.getRow(inHeader));
  const inRows = 6;
  for (let i = 0; i < inRows; i++) ws.getCell(inHeader + 1 + i, 2).numFmt = '#,##0"円"';
  applyBodyBorders(ws, inHeader + 1, inHeader + inRows, 4);
  const inTotal = inHeader + inRows + 1;
  ws.getCell(inTotal, 1).value = "入金合計";
  ws.getCell(inTotal, 1).font = { bold: true };
  ws.getCell(inTotal, 2).value = { formula: `SUM(B${inHeader + 1}:B${inHeader + inRows})` };
  ws.getCell(inTotal, 2).numFmt = '#,##0"円"';
  ws.getCell(inTotal, 2).font = { bold: true };
  ws.getCell(inTotal, 1).border = thinBorder;
  ws.getCell(inTotal, 2).border = thinBorder;

  // 控除（支出）ブロック
  r = inTotal + 2;
  ws.getCell(r, 1).value = "■ 差引（管理手数料・修繕費など）";
  ws.getCell(r, 1).font = { bold: true, size: 12, color: { argb: NAVY } };
  r++;
  const outHeader = r;
  ws.getRow(outHeader).values = ["項目", "金額", "", "備考"];
  styleHeaderRow(ws.getRow(outHeader));
  const outRows = 6;
  for (let i = 0; i < outRows; i++) ws.getCell(outHeader + 1 + i, 2).numFmt = '#,##0"円"';
  applyBodyBorders(ws, outHeader + 1, outHeader + outRows, 4);
  const outTotal = outHeader + outRows + 1;
  ws.getCell(outTotal, 1).value = "差引合計";
  ws.getCell(outTotal, 1).font = { bold: true };
  ws.getCell(outTotal, 2).value = { formula: `SUM(B${outHeader + 1}:B${outHeader + outRows})` };
  ws.getCell(outTotal, 2).numFmt = '#,##0"円"';
  ws.getCell(outTotal, 2).font = { bold: true };
  ws.getCell(outTotal, 1).border = thinBorder;
  ws.getCell(outTotal, 2).border = thinBorder;

  // 送金額
  const remitRow = outTotal + 2;
  ws.getCell(remitRow, 1).value = "お振込金額（入金合計 − 差引合計）";
  ws.getCell(remitRow, 1).font = { bold: true, size: 12, color: { argb: NAVY } };
  ws.getCell(remitRow, 2).value = { formula: `B${inTotal}-B${outTotal}` };
  ws.getCell(remitRow, 2).numFmt = '#,##0"円"';
  ws.getCell(remitRow, 2).font = { bold: true, size: 12, color: { argb: NAVY } };
  for (const c of [1, 2]) {
    ws.getCell(remitRow, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
    ws.getCell(remitRow, c).border = thinBorder;
  }
  ws.mergeCells(remitRow + 2, 1, remitRow + 2, 4);
  ws.getCell(remitRow + 2, 1).value = "お振込予定日：　　　　年　　月　　日　／　振込先：　　　　　　　　";
  ws.getCell(remitRow + 2, 1).font = { size: 10, color: { argb: "FF4A5568" } };

  addCredit(ws, remitRow + 4, 4);

  await wb.xlsx.writeFile(join(OUT_DIR, "owner-remittance-statement-template.xlsx"));
  console.log("✓ owner-remittance-statement-template.xlsx");
}

// ── 6. 家賃滞納 督促状（Word） ─────────────────────
async function buildRentDemandLetter() {
  const accent = "1A365D";
  const gray = "718096";
  const p = (children, opts = {}) =>
    new Paragraph({ spacing: { after: 160 }, children, ...opts });
  const run = (text, opts = {}) => new TextRun({ text, font: "Yu Gothic", size: 21, ...opts });

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
            children: [run("　　　　年　　月　　日", { color: gray })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            heading: HeadingLevel.HEADING_1,
            children: [run("家賃お支払いのお願い", { bold: true, size: 32, color: accent })],
          }),
          p([run("　　　　　　　　　　　様")]),
          p([
            run(
              "平素より当物件をご利用いただきありがとうございます。さて、下記のとおり家賃のお支払いが確認できておりません。お忙しいところ恐れ入りますが、ご確認のうえ、お早めにお振込みくださいますようお願い申し上げます。"
            ),
          ]),
          p([
            run(
              "本書面と行き違いでお支払いいただいている場合は、何卒ご容赦ください。",
              { color: gray, size: 19 }
            ),
          ]),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 160 },
            children: [run("記", { bold: true })],
          }),
          ...[
            ["物件名・部屋番号", "　"],
            ["未払いの対象月", "　　　　年　　月分　（　　　　年　　月分まで）"],
            ["未払い額（税込）", "　　　　　　円"],
            ["お支払い期限", "　　　　年　　月　　日"],
            ["お振込先", "　　　　銀行　　　　支店　普通　　　　　　　　　"],
          ].map(
            ([k, v]) =>
              new Paragraph({
                spacing: { after: 120 },
                children: [run("● " + k + "：", { bold: true }), run(v)],
              })
          ),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 200 },
            children: [run("以上", { bold: true })],
          }),
          p([
            run(
              "ご事情によりお支払いが難しい場合は、今後のお支払いについてご相談させていただきますので、下記まで早めにご連絡ください。ご連絡なくお支払いがない場合、連帯保証人・保証会社へのご連絡など、次の手続きに進む場合がございます。"
            ),
          ]),
          new Paragraph({
            spacing: { before: 320 },
            alignment: AlignmentType.RIGHT,
            children: [run("管理会社名：　　　　　　　　　　", { color: accent })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [run("担当：　　　　　　　TEL：　　　　　　　　　", { color: accent })],
          }),
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: "本テンプレートは Roomly（hp.roomly.jp）が無料提供しています。",
                font: "Yu Gothic",
                size: 16,
                italics: true,
                color: gray,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await writeFile(join(OUT_DIR, "rent-demand-letter-template.docx"), buffer);
  console.log("✓ rent-demand-letter-template.docx");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await buildRentLedger();
  await buildMoveOutSettlement();
  await buildRestorationBurdenSheet();
  await buildContractRenewalNotice();
  await buildOwnerRemittanceStatement();
  await buildRentDemandLetter();
  console.log("\nすべてのテンプレートを生成しました → public/templates/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
