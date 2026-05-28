"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "roomly_beta_notice_dismissed_v1";

export default function BetaNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div className="border-b border-line bg-accent-tint/40 px-5 py-2 text-[12.5px] text-ink-2 leading-relaxed">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-bg border border-line text-ink-3 shrink-0 mt-0.5">
          BETA
        </span>
        <p className="flex-1">
          Roomlyは現在ベータ版として提供しています。動かない機能や不具合はもちろん、「こんな機能がほしい」「ここがこうなっていると使いやすい」といったご要望も{" "}
          <a href="mailto:contact@roomly.jp" className="text-accent hover:underline">
            contact@roomly.jp
          </a>
          {" "}までメールでお知らせください。ご協力よろしくお願いします。
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="閉じる"
          className="shrink-0 text-ink-3 hover:text-ink transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
