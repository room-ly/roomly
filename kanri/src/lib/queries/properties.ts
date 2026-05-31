import { createClient, type Row } from "./_shared";

// 物件一覧（オーナー名・部屋情報・代表画像付き）
export async function getProperties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, owner:owners(id, name), units(id, status, rent)")
    .order("name");
  if (error) throw error;

  const properties = (data ?? []) as Row[];
  if (properties.length === 0) return properties;

  const propertyIds = properties.map((p: Row) => p.id);
  const { data: images } = await supabase
    .from("documents")
    .select("property_id, file_path, is_primary")
    .in("property_id", propertyIds)
    .is("unit_id", null)
    .eq("document_type", "photo")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const thumbnailMap = new Map<string, string>();
  for (const img of images ?? []) {
    if (!img.property_id) continue;
    if (img.is_primary || !thumbnailMap.has(img.property_id)) {
      thumbnailMap.set(
        img.property_id,
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${img.file_path}`
      );
    }
  }

  return properties.map((p: Row) => ({
    ...p,
    thumbnail_url: thumbnailMap.get(p.id) ?? null,
  }));
}

// 物件セレクトリスト
export async function getPropertiesForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, owner_id, default_allocation_method")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p: Row) => ({
    id: p.id,
    label: p.name,
    owner_id: p.owner_id,
    default_allocation_method: p.default_allocation_method,
  }));
}
