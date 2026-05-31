import { createClient, type Row } from "./_shared";

export async function getPayeesForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payees")
    .select("id, name, category")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p: Row) => ({
    id: p.id,
    label: p.name,
    category: p.category,
  }));
}
