"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import PropertyFormModal from "./PropertyFormModal";
import CsvImportModal from "./CsvImportModal";

interface Owner {
  id: string;
  name: string;
}

interface PropertiesPageClientProps {
  owners: Owner[];
}

export default function PropertiesPageClient({
  owners,
}: PropertiesPageClientProps) {
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
          物件を追加
        </button>
      </div>
      <PropertyFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        owners={owners}
      />
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        type="properties"
      />
    </>
  );
}
