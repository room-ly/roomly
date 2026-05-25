"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface StationOption {
  station_cd: string;
  station_name: string;
  line_name: string | null;
  company_name: string | null;
}

interface StationInputProps {
  // 表示名テキストを送る name（例: nearest_station）
  name: string;
  // 駅コードを送る name（例: nearest_station_id）
  idName: string;
  defaultValue?: string;
  defaultId?: string;
  placeholder?: string;
  className?: string;
}

// 駅名サジェスト入力。
// 入力すると /api/stations を叩いて候補を出し、選ぶと表示名（路線つき）と駅コードを確定する。
// マスタにない駅・マスタ未適用環境でも、入力テキストはそのまま name に残るので壊れない（自由入力フォールバック）。
export default function StationInput({
  name,
  idName,
  defaultValue = "",
  defaultId = "",
  placeholder = "駅名を入力（例: 新宿）",
  className = "input",
}: StationInputProps) {
  const [text, setText] = useState(defaultValue);
  const [stationId, setStationId] = useState(defaultId);
  const [options, setOptions] = useState<StationOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 表示用ラベル「駅名（路線名）」
  function label(o: StationOption) {
    return o.line_name ? `${o.station_name}（${o.line_name}）` : o.station_name;
  }

  // 外側クリックで閉じる
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function search(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 1) {
      setOptions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stations?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setOptions(data.stations ?? []);
        setOpen(true);
        setHighlight(-1);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function pick(o: StationOption) {
    setText(label(o));
    setStationId(o.station_cd);
    setOpen(false);
  }

  function onChange(v: string) {
    setText(v);
    // テキストを手で書き換えたら駅コードの紐付けは外す（自由入力に戻る）
    setStationId("");
    search(v);
  }

  return (
    <div ref={boxRef} className="relative">
      {/* FormData 送信用 */}
      <input type="hidden" name={name} value={text} />
      <input type="hidden" name={idName} value={stationId} />

      <div className="relative">
        <input
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => text.trim().length >= 1 && options.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              if (highlight >= 0 && options[highlight]) {
                e.preventDefault();
                pick(options[highlight]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={className}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2
            size={14}
            className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-2"
          />
        )}
      </div>

      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-line bg-card shadow-lg text-sm">
          {options.map((o, i) => (
            <li
              key={o.station_cd}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2 cursor-pointer flex items-baseline gap-2 ${
                i === highlight ? "bg-bg-2" : ""
              }`}
            >
              <span className="font-medium text-ink">{o.station_name}</span>
              {o.line_name && (
                <span className="text-xs text-ink-2 truncate">{o.line_name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
