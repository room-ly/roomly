"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import InquiryFormModal from "./InquiryFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface InquiriesPageClientProps {
  properties: SelectOption[];
  units: SelectOption[];
  tenants: SelectOption[];
}

export default function InquiriesPageClient({ properties, units, tenants }: InquiriesPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        問い合わせを登録
      </button>
      <InquiryFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        properties={properties}
        units={units}
        tenants={tenants}
      />
    </>
  );
}
