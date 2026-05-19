"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Download, Trash2, X, Paperclip } from "lucide-react";

interface DocumentSectionProps {
  propertyId?: string;
  tenantId?: string;
  title?: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: "契約書",
  photo: "写真",
  key_receipt: "鍵預かり証",
  inspection: "点検記録",
  other: "その他",
};

export default function DocumentSection({ propertyId, tenantId, title = "書類" }: DocumentSectionProps) {
  const [docs, setDocs] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchDocs = useCallback(async () => {
    const params = new URLSearchParams();
    if (propertyId) params.set("property_id", propertyId);
    if (tenantId) params.set("tenant_id", tenantId);
    const res = await fetch(`/api/documents?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDocs(data);
    }
    setLoading(false);
  }, [propertyId, tenantId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    setUploading(true);
    const fd = new FormData(e.currentTarget);
    if (propertyId) fd.set("property_id", propertyId);
    if (tenantId) fd.set("tenant_id", tenantId);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        setUploadError(err.error || "アップロードに失敗しました");
        return;
      }
      setUploadOpen(false);
      fetchDocs();
    } catch {
      setUploadError("アップロード中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`「${fileName}」を削除しますか？`)) return;
    const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchDocs();
  }

  if (loading) return null;

  return (
    <div className="section">
      <div className="section-head-bar">
        <h2 style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Paperclip size={15} />
          {title}
        </h2>
        <button
          onClick={() => setUploadOpen(true)}
          className="btn btn-ghost btn-sm flex items-center gap-1"
          style={{ fontSize: 12 }}
        >
          <Upload size={12} /> 追加
        </button>
      </div>
      <div className="section-body" style={docs.length === 0 && !uploadOpen ? { textAlign: "center", padding: "20px 0" } : undefined}>
        {docs.length === 0 && !uploadOpen && (
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>書類がありません</p>
        )}

        {docs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0", borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.file_name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 8, marginTop: 2 }}>
                    <span>{DOC_TYPE_LABELS[d.document_type] || d.document_type}</span>
                    {d.file_size && <span className="mono">{formatFileSize(d.file_size)}</span>}
                    <span className="mono">{d.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {d.file_path && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${d.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-ink-3 hover:text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Download size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(d.id, d.file_name)}
                    className="p-1 rounded text-ink-3 hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setUploadOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">書類をアップロード</h3>
              <button onClick={() => setUploadOpen(false)} className="text-ink-3 hover:text-ink transition-colors"><X size={18} /></button>
            </div>
            {uploadError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">{uploadError}</div>
            )}
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">ファイル <span className="text-danger">*</span></label>
                <input name="file" type="file" required className="input text-[13px]" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">種別</label>
                <select name="document_type" className="input" defaultValue="other">
                  <option value="contract">契約書</option>
                  <option value="photo">写真</option>
                  <option value="key_receipt">鍵預かり証</option>
                  <option value="inspection">点検記録</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setUploadOpen(false)} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm">キャンセル</button>
                <button type="submit" disabled={uploading} className="btn btn-primary disabled:opacity-50">
                  {uploading ? "アップロード中..." : "アップロード"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
