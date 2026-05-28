"use client";

import { useState } from "react";
import { Pencil, Upload } from "lucide-react";
import PropertyFormModal from "./PropertyFormModal";
import CsvImportModal from "./CsvImportModal";

interface Owner {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  label: string;
  role?: string;
}

interface PropertyDetailClientProps {
  propertyId: string;
  property: Record<string, any>;
  owners: Owner[];
  users?: UserOption[];
  units: Record<string, any>[];
  contracts: Record<string, any>[];
}

export default function PropertyDetailClient({
  propertyId: _propertyId,
  property,
  owners,
  users = [],
  units,
  contracts,
}: PropertyDetailClientProps) {
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // 戸建ては1建物=1区画。複数部屋の一括取込は不要なのでCSVインポートは出さない
  const isHouse = property.property_type === "house";

  return (
    <>
      <div className="flex items-center gap-2">
        {!isHouse && (
          <button
            className="btn btn-secondary"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload size={14} />
            部屋をCSVインポート
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={() => setPropertyModalOpen(true)}
        >
          <Pencil size={14} />
          物件を編集
        </button>
      </div>

      <PropertyFormModal
        isOpen={propertyModalOpen}
        onClose={() => setPropertyModalOpen(false)}
        owners={owners}
        users={users}
        editData={property}
        units={units}
        contracts={contracts}
      />

      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="units"
        propertyId={_propertyId}
      />
    </>
  );
}
