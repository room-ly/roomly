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
  showRefund?: boolean;
}

export default function RentDetailClient({ billing, showRefund }: RentDetailClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"payment" | "refund">("payment");

  return (
    <>
      <div className="flex gap-2">
        {showRefund && (
          <button
            className="text-[12px] px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
            onClick={() => { setMode("refund"); setIsOpen(true); }}
          >
            返金登録
          </button>
        )}
        <button
          className="btn btn-primary text-[12px]"
          onClick={() => { setMode("payment"); setIsOpen(true); }}
        >
          入金登録
        </button>
      </div>
      <RentPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        billing={billing}
        mode={mode}
      />
    </>
  );
}
