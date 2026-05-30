"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import PropertyFormModal from "./PropertyFormModal";
import CsvImportModal from "./CsvImportModal";
import { usePermission } from "@/lib/use-permission";

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
  const canCreate = usePermission("properties:create");

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
