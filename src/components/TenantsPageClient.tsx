"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import TenantFormModal from "./TenantFormModal";
import CsvImportModal from "./CsvImportModal";

export default function TenantsPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          className="btn-secondary"
          onClick={() => setIsImportOpen(true)}
        >
          <Upload size={14} />
          CSVインポート
        </button>
        <button className="btn-primary" onClick={() => setIsOpen(true)}>
          <Plus size={14} />
          入居者を追加
        </button>
      </div>
      <TenantFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        type="tenants"
      />
    </>
  );
}
