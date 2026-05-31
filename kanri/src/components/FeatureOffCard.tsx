"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  title: string;
  description: string;
  canEnable: boolean;
  disabledReason?: string;
  children?: ReactNode;
}

export default function FeatureOffCard({
  title,
  description,
  canEnable,
  disabledReason,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px dashed var(--line)",
        borderRadius: 10,
        padding: "12px 14px",
        background: "var(--card)",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-3)",
            flexShrink: 0,
          }}
        >
          <Sparkles size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>
            {title}{" "}
            <span
              style={{
                fontSize: 10,
                color: "var(--ink-3)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              拡張機能 / オフ中
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {description}
          </div>
        </div>
        {canEnable ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setOpen((v) => !v)}
            style={{ flexShrink: 0 }}
          >
            {open ? (
              <>
                <ChevronUp size={14} style={{ marginRight: 4 }} />
                閉じる
              </>
            ) : (
              <>
                <ChevronDown size={14} style={{ marginRight: 4 }} />
                この機能を使う
              </>
            )}
          </button>
        ) : (
          <span style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>
            {disabledReason ?? "管理者のみオンにできます"}
          </span>
        )}
      </div>
      {open && canEnable && children && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
