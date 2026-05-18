export type Property = {
  id: string;
  name: string;
  property_type: string;
  postal_code: string | null;
  address: string;
  structure: string | null;
  floors: number | null;
  built_year: number | null;
  total_units: number | null;
  nearest_station: string | null;
  walk_minutes: number | null;
};

export type Unit = {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number | null;
  layout: string | null;
  area_sqm: number | null;
  rent: number;
  management_fee: number;
  deposit: number;
  key_money: number;
  status: string;
  equipment: string[] | null;
};

export type Vacancy = {
  id: string;
  unit_id: string;
  available_from: string;
  listing_status: string;
  ad_comment: string | null;
  viewing_available: boolean;
};

export type VacancyListing = Vacancy & {
  unit: Unit & {
    property: Property;
  };
};
