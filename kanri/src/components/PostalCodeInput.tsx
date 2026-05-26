"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface PostalCodeResult {
  prefecture: string;
  city: string;
  town: string;
  address: string;
}

interface PostalCodeInputProps {
  // input の name 属性（FormData で送信されるキー）。非制御モードで使う。
  name?: string;
  defaultValue?: string;
  // 制御モード: value と onChange を渡すと親が値を保持する。
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  // 住所が取得できたときに呼ばれる。各フォームで分割代入するか address にまとめるか決める
  onResolved: (result: PostalCodeResult) => void;
}

// 郵便番号を入力 → /api/postal-code を叩いて住所を取得するコンポーネント。
// 入力欄の右に検索ボタンを置き、Enter キーでも検索できる。
// value + onChange を渡せば制御モード、無ければ defaultValue + name の非制御モード。
export default function PostalCodeInput({
  name = "postal_code",
  defaultValue = "",
  value: controlledValue,
  onChange,
  placeholder = "例: 160-0023",
  className = "input",
  onResolved,
}: PostalCodeInputProps) {
  const isControlled = controlledValue !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : innerValue;
  const setValue = (v: string) => {
    if (isControlled) onChange?.(v);
    else setInnerValue(v);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    const code = value
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[^\d]/g, "");
    if (code.length !== 7) {
      setError("郵便番号は7桁で入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/postal-code?code=${code}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "住所の取得に失敗しました");
        return;
      }
      onResolved(data as PostalCodeResult);
    } catch {
      setError("住所検索サービスに接続できませんでした");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-1.5">
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              lookup();
            }
          }}
          className={`${className} min-w-0 flex-1`}
          placeholder={placeholder}
          inputMode="numeric"
        />
        <button
          type="button"
          onClick={lookup}
          disabled={loading}
          className="shrink-0 flex items-center gap-1 px-2.5 rounded-lg border border-line bg-bg-2 text-ink-2 text-[12px] hover:bg-bg-2/80 transition-colors disabled:opacity-50"
          title="郵便番号から住所を検索"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
          <span className="hidden sm:inline">住所検索</span>
        </button>
      </div>
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
}
