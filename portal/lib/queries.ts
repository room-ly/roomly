import { supabase } from "./supabase";
import type { VacancyListing } from "./types";

export async function fetchVacancies(filters?: {
  area?: string;
  layoutFilter?: string;
  rentMax?: number;
}): Promise<VacancyListing[]> {
  let query = supabase
    .from("vacancies")
    .select(
      `
      id,
      unit_id,
      available_from,
      listing_status,
      ad_comment,
      viewing_available,
      unit:units!inner (
        id,
        property_id,
        unit_number,
        floor,
        layout,
        area_sqm,
        rent,
        management_fee,
        deposit,
        key_money,
        status,
        equipment,
        property:properties!inner (
          id,
          name,
          property_type,
          postal_code,
          address,
          structure,
          floors,
          built_year,
          total_units,
          nearest_station,
          walk_minutes
        )
      )
    `
    )
    .eq("listing_status", "active")
    .order("created_at", { ascending: false });

  if (filters?.area) {
    query = query.ilike("unit.property.address", `%${filters.area}%`);
  }
  if (filters?.layoutFilter) {
    query = query.eq("unit.layout", filters.layoutFilter);
  }
  if (filters?.rentMax) {
    query = query.lte("unit.rent", filters.rentMax);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchVacancies error:", error);
    return [];
  }
  return (data as unknown as VacancyListing[]) ?? [];
}

export async function fetchVacancyById(
  vacancyId: string
): Promise<VacancyListing | null> {
  const { data, error } = await supabase
    .from("vacancies")
    .select(
      `
      id,
      unit_id,
      available_from,
      listing_status,
      ad_comment,
      viewing_available,
      unit:units!inner (
        id,
        property_id,
        unit_number,
        floor,
        layout,
        area_sqm,
        rent,
        management_fee,
        deposit,
        key_money,
        status,
        equipment,
        property:properties!inner (
          id,
          name,
          property_type,
          postal_code,
          address,
          structure,
          floors,
          built_year,
          total_units,
          nearest_station,
          walk_minutes
        )
      )
    `
    )
    .eq("id", vacancyId)
    .single();

  if (error) {
    console.error("fetchVacancyById error:", error);
    return null;
  }
  return data as unknown as VacancyListing;
}
