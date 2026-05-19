"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, Trash2, X, Search } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface SelectOption {
  id: string;
  label: string;
}

interface DocumentsPageClientProps {
  documents: Record<string, any>[];
  properties: SelectOption[];
  tenants: SelectOption[];
}

const DOC_TYPES = [
  { value: "", label: "すべて" },
  { value: "contract", label: "契約書" },
  { value: "photo", label: "写真" },
  { value: "key_receipt", label: "鍵預かり証" },
  { value: "inspection", label: "点検記録" },
  { value: "other", label: "その他" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function DocumentsPageClient({ documents, properties, tenants }: DocumentsPageClientProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter && d.document_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          d.file_name?.toLowerCase().includes(q) ||
          d.property?.name?.toLowerCase().includes(q) ||
          d.tenant?.name?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [documents, typeFilter, search]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    setUploading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        setUploadError(err.error || "アップロードに失敗しました");
        return;
      }
      setUploadOpen(false);
      router.refresh();
    } catch {
      setUploadError("アップロード中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`「${fileName}」を削除しますか？`)) return;
    const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <>
      <div className="toolbar">
        <div className="tb-tabs">
          {DOC_TYPES.map((t) => (
            <span
              key={t.value}
              className={`tb-tab${typeFilter === t.value ? " is-active" : ""}`}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </span>
          ))}
        </div>
        <div className="tb-actions flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 w-48 text-[13px]"
            />
          </div>
          <button onClick={() => setUploadOpen(true)} className="btn btn-primary flex items-center gap-1.5">
            <Upload size={14} /> アップロード
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-body flush">
          {filtered.length === 0 ? (
            <p className="text-center text-ink-3 text-[13px] py-8">書類がありません</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>ファイル名</th>
                  <th>種別</th>
                  <th>関連物件</th>
                  <th>関連入居者</th>
                  <th>サイズ</th>
                  <th>登録日</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="row-hover">
                    <td className="strong">{d.file_name}</td>
                    <td><StatusBadge status={d.document_type || "other"} /></td>
                    <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{d.property?.name || "—"}</td>
                    <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{d.tenant?.name || "—"}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{d.file_size ? formatFileSize(d.file_size) : "—"}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{d.created_at?.slice(0, 10)}</td>
                    <td>
                      <div className="flex items-center gap-1">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {uploadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setUploadOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold">書類をアップロード</h2>
              <button onClick={() => setUploadOpen(false)} className="text-ink-3 hover:text-ink transition-colors"><X size={18} /></button>
            </div>

            {uploadError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{uploadError}</div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
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
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">関連物件</label>
                <select name="property_id" className="input">
                  <option value="">なし</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">関連入居者</label>
                <select name="tenant_id" className="input">
                  <option value="">なし</option>
                  {tenants.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setUploadOpen(false)} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm">キャンセル</button>
                <button type="submit" disabled={uploading} className="btn btn-primary disabled:opacity-50">
                  {uploading ? "アップロード中..." : "アップロード"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
