"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; place: string }
  | { kind: "error"; message: string };

export default function WhereAmIPage() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const detect = () => {
    if (!("geolocation" in navigator)) {
      setState({ kind: "error", message: "このブラウザは位置情報に対応していません" });
      return;
    }
    setState({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja&zoom=14`;
          const res = await fetch(url, { headers: { "Accept": "application/json" } });
          const data = await res.json();
          const a = data.address ?? {};
          const place =
            [a.country, a.state, a.city ?? a.town ?? a.village, a.suburb ?? a.neighbourhood]
              .filter(Boolean)
              .join(" ") || data.display_name || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setState({ kind: "ok", place });
        } catch {
          setState({ kind: "ok", place: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}` });
        }
      },
      (err) => {
        setState({ kind: "error", message: err.message || "位置情報を取得できませんでした" });
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">現在地</h1>
      <p className="text-sm text-ink-3 mb-6">
        ボタンを押すとブラウザの位置情報からあなたの居場所を表示します（誰にも通知されません）。
      </p>

      <button
        onClick={detect}
        disabled={state.kind === "loading"}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-white text-sm hover:opacity-90 disabled:opacity-50"
      >
        <MapPin size={16} />
        {state.kind === "loading" ? "取得中..." : "現在地を教える"}
      </button>

      {state.kind === "ok" && (
        <div className="mt-10 text-center">
          <div className="text-sm text-ink-3 mb-3">あなたの居場所は</div>
          <div className="text-4xl md:text-5xl font-bold leading-tight break-words">
            {state.place}
          </div>
          <div className="text-sm text-ink-3 mt-3">です。</div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-6 text-sm text-danger bg-danger-tint border border-danger/20 rounded p-3">
          {state.message}
        </div>
      )}
    </div>
  );
}
