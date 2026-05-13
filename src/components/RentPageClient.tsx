"use client";

import { useState } from "react";
import RentPaymentModal from "./RentPaymentModal";

interface BillingInfo {
  id: string;
  total_amount: number;
  paid_amount: number;
  tenant_name: string;
  unit_label: string;
  billing_month: string;
}

interface RentPaymentButtonProps {
  billing: BillingInfo;
}

export function RentPaymentButton({ billing }: RentPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary text-[11px] px-2 py-1"
      >
        入金登録
      </button>
      <RentPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        billing={billing}
      />
    </>
  );
}
