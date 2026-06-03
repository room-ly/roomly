import { getProperties, getOwnersForSelect, getUsersForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import PropertiesPageClient from "@/components/PropertiesPageClient";
import PropertiesGrid from "@/components/PropertiesGrid";

export default async function PropertiesPage() {
  // この画面でownersはドロップダウンの選択肢(id, name)にしか使わない。
  // getOwners()はオーナー配下の全物件・全部屋をネスト取得する重いクエリで、ここでは過剰だった。
  // 選択肢用の軽量クエリ getOwnersForSelect() に置き換えてRSCのサーバー時間を削減する。
  const [properties, owners, users] = await Promise.all([
    getProperties(),
    getOwnersForSelect(),
    getUsersForSelect(),
  ]);

  const ownerOptions = owners.map((o: { id: string; label: string }) => ({
    id: o.id,
    name: o.label,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Properties"
        title="物件"
        em={`${properties.length}棟`}
        description="管理中の物件を一覧。物件カードから入居状況・収支・修繕履歴をまとめて確認できます。"
        action={<PropertiesPageClient owners={ownerOptions} users={users} />}
      />

      <PropertiesGrid properties={properties} owners={ownerOptions} users={users} />
    </>
  );
}
