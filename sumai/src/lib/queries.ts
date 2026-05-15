import { createClient, getTenantId } from "@/lib/supabase-server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

export async function getTenantContract() {
  const tenantId = await getTenantId();
  if (!tenantId) return null;

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("*, unit:units(unit_number, property:properties(name, address)), tenant:tenants(name, email, phone)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();

  return contract as Row | null;
}

export async function getMoveOutRequests() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("move_out_requests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Row[];
}

export async function getMaintenanceRequests() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_requests")
    .select("*, property:properties(name), unit:units(unit_number)")
    .eq("tenant_id", tenantId)
    .order("reported_date", { ascending: false });

  return (data ?? []) as Row[];
}

export async function getCompanyName() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("companies")
    .select("name")
    .single();

  return (data?.name as string) ?? "";
}
