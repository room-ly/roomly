"use client";

export default function DemoNotice() {
  return (
    <div className="border-b border-warning/30 bg-warning/10 px-5 py-2 text-[12.5px] text-ink-2 leading-relaxed">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-bg border border-warning/40 text-warning shrink-0 mt-0.5">
          DEMO
        </span>
        <p className="flex-1">
          ここはデモ環境です。物件・契約・入居者などを自由に作成・編集・削除して動作確認していただけます。データは定期的に初期状態にリセットされるため、操作内容は保存されません。
        </p>
      </div>
    </div>
  );
}
