"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import TenantFormModal from "./TenantFormModal";
import CsvImportModal from "./CsvImportModal";
import { usePermission } from "@/lib/use-permission";

export default function TenantsPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const canCreate = usePermission("tenants:create");

  if (!canCreate) return null;

  return (
    <>
      <div className="flex gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => setIsImportOpen(true)}
        >
          <Upload size={14} />
          CSVインポート
        </button>
        <button className="btn btn-accent" onClick={() => setIsOpen(true)}>
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
