import { redirect } from "next/navigation";

// 振込バッチ作成は /payments に統合済み。旧URL・ブックマーク救済のためリダイレクト。
export default function NewBatchPage() {
  redirect("/payments");
}
