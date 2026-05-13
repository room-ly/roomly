"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import InquiryFormModal from "./InquiryFormModal";

export default function InquiriesPageClient() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        問い合わせを登録
      </button>
      <InquiryFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
