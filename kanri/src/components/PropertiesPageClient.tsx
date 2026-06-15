"use client";

import { useState } from "react";
import { Plus, Upload, Download } from "lucide-react";
import PropertyFormModal from "./PropertyFormModal";
import CsvImportModal from "./CsvImportModal";
import { usePermission } from "@/lib/use-permission";
import { useNotify } from "@/lib/confirm-context";

interface Owner {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  label: string;
  role?: string;
}

interface PropertiesPageClientProps {
  owners: Owner[];
  users?: UserOption[];
}

export default function PropertiesPageClient({
  owners,
  users = [],
}: PropertiesPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canCreate = usePermission("properties:create");
  const notify = useNotify();

  if (!canCreate) return null;

  // 物件台帳をCSVでダウンロード（/api/export がRLSでcompany_id絞り込み済み）
  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export?type=properties");
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "properties.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      notify({ title: "エクスポートに失敗しました" });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          className="btn btn-secondary"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download size={14} />
          {isExporting ? "出力中…" : "CSVエクスポート"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setIsImportOpen(true)}
        >
          <Upload size={14} />
          CSVインポート
        </button>
        <button className="btn btn-accent" onClick={() => setIsOpen(true)}>
          <Plus size={14} />
          物件を追加
        </button>
      </div>
      <PropertyFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        owners={owners}
        users={users}
      />
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        type="properties"
      />
    </>
  );
}
