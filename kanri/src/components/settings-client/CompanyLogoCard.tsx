"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";

type Company = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function logoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`;
}

export default function CompanyLogoCard({
  company,
  canEditSettings,
}: {
  company: Company;
  canEditSettings: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    company?.logo_path ? logoUrl(company.logo_path) : null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok) {
      setPreview(data.url);
      router.refresh();
    } else {
      setError(data.error || "アップロードに失敗しました");
    }
    setUploading(false);
    // 同じファイルを選び直しても change が発火するようリセットする
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete() {
    setError("");
    setUploading(true);
    const res = await fetch("/api/settings/logo", { method: "DELETE" });
    if (res.ok) {
      setPreview(null);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "削除に失敗しました");
    }
    setUploading(false);
  }

  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-1">ロゴ・押印欄</h2>
      <p className="text-[12px] text-ink-3 mb-4">
        送金明細PDFなどの帳票に差し込まれます
      </p>

      <div className="flex items-start gap-4">
        <div className="w-40 h-20 border border-line rounded flex items-center justify-center bg-surface-2 shrink-0 overflow-hidden">
          {preview ? (
            // Storage の外部URLかつ帳票プレビュー用途のため next/image は使わない
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="会社ロゴ" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-[12px] text-ink-3">未登録</span>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFile}
            disabled={!canEditSettings || uploading}
            className="hidden"
          />
          {canEditSettings && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary text-[13px] inline-flex items-center gap-1.5"
              >
                <Upload size={14} />
                {uploading ? "アップロード中..." : preview ? "変更" : "アップロード"}
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="btn-secondary text-[13px] inline-flex items-center gap-1.5 text-danger"
                >
                  <Trash2 size={14} />
                  削除
                </button>
              )}
            </div>
          )}
          {canEditSettings && (
            <p className="text-[12px] text-ink-3 mt-2">
              JPEG / PNG / WebP / SVG、2MBまで。横長（推奨 400×160px 程度）
            </p>
          )}
          {error && <p className="text-[12px] text-danger mt-1">{error}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
        <input
          type="checkbox"
          name="seal_column_enabled"
          defaultChecked={company?.seal_column_enabled ?? false}
          disabled={!canEditSettings}
        />
        <span className="text-[13px]">帳票に押印欄を表示する</span>
      </label>
    </div>
  );
}
