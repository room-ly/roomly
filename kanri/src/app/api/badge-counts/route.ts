import { NextResponse } from "next/server";
import { getBadgeCounts } from "@/lib/queries";

export async function GET() {
  try {
    const counts = await getBadgeCounts();
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json(
      {
        "/": 0,
        "/rent": 0,
        "/maintenance": 0,
        "/inquiries": 0,
        "/contracts": 0,
        company_name: "",
        contract_alert_days: 90,
        user_name: "",
        user_email: "",
      },
      { status: 500 }
    );
  }
}
