"use client";

import { useEffect, useRef } from "react";

// 入力変化を3秒デバウンスしてサーバーに送信する。
// 過剰送信を防ぐためページ表示直後の初期値送信もデバウンス対象とし、
// 同一値が連続したときは2回目以降を送信しない。
export function useToolLog(
  toolSlug: string,
  inputs: Record<string, unknown>,
  result?: Record<string, unknown>
) {
  const lastSentRef = useRef<string>("");
  const inputsJson = JSON.stringify(inputs);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      if (lastSentRef.current === inputsJson) return;
      lastSentRef.current = inputsJson;

      fetch("/api/tool-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_slug: toolSlug, inputs, result }),
        keepalive: true,
      }).catch(() => {
        // 通信失敗時はサイレント
      });
    }, 3000);

    return () => window.clearTimeout(timer);
    // resultはinputsから一意に計算されるので依存にはinputsだけで十分
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsJson, toolSlug]);
}
