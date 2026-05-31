import { createClient, type Row } from "./_shared";

export async function getUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, created_at")
    .eq("is_active", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 社内ユーザーセレクトリスト（承認者選択など用途）
export async function getUsersForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((u: Row) => ({
    id: u.id,
    label: u.name,
    role: u.role,
  }));
}
