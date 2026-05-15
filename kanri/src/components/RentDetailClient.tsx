"use client";

import { useState } from "react";
import RentPaymentModal from "./RentPaymentModal";

interface RentDetailClientProps {
  billing: {
    id: string;
    total_amount: number;
    paid_amount: number;
    tenant_name: string;
    unit_label: string;
    billing_month: string;
  };
}

export default function RentDetailClient({ billing }: RentDetailClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary text-[12px]" onClick={() => setIsOpen(true)}>
        入金登録
      </button>
      <RentPaymentModal isOpen={isOpen} onClose={() => setIsOpen(false)} billing={billing} />
    </>
  );
}
