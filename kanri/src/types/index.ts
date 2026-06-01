export type UserRole = "admin" | "staff" | "viewer";

export type PropertyType = "apartment" | "apart" | "house" | "commercial" | "parking" | "land";

export type UnitStatus = "vacant" | "occupied" | "reserved" | "maintenance";

export type ContractStatus = "active" | "expired" | "terminated" | "pending";

export type ContractType = "fixed" | "ordinary";

// DBに保存するステータス。「overdue（滞納）」は due_date と支払い実額から派生（lib/billing-status.ts）
export type BillingStatus = "unpaid" | "partial" | "paid";

export type PaymentMethod = "transfer" | "card" | "cash" | "debit";

export type CasePriority = "low" | "normal" | "high" | "urgent";

export type CaseStatus =
  | "open"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export type CaseCategory =
  | "repair"
  | "key"
  | "common_area"
  | "tenant_trouble"
  | "neighbor"
  | "inspection"
  | "inquiry"
  | "request"
  | "complaint"
  | "other";

export interface Company {
  id: string;
  name: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  plan: "free" | "pro";
  max_units: number;
}

export interface Owner {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  email?: string;
}

export type ManagementForm =
  | "self"
  | "full_management"
  | "partial_management"
  | "sublet";

export type LandRights = "ownership" | "leasehold" | "sublease";

export type TransactionType =
  | "owner"
  | "agent"
  | "intermediary"
  | "sublet";

export interface Property {
  id: string;
  company_id: string;
  owner_id: string;
  name: string;
  name_kana?: string;
  property_code?: string;
  property_type: PropertyType;
  // 所在地
  postal_code?: string;
  address: string;
  prefecture?: string;
  city?: string;
  town?: string;
  building_number?: string;
  latitude?: number;
  longitude?: number;
  // 交通
  nearest_station?: string;
  walk_minutes?: number;
  nearest_station_2?: string;
  walk_minutes_2?: number;
  nearest_station_3?: string;
  walk_minutes_3?: number;
  bus_station?: string;
  bus_minutes?: number;
  // 建物
  structure?: string;
  floors?: number;
  underground_floors?: number;
  total_units?: number;
  total_area_sqm?: number;
  building_area_sqm?: number;
  land_area_sqm?: number;
  built_year?: number;
  built_month?: number;
  renovation_year?: number;
  renovation_month?: number;
  // 管理・設備
  management_form?: ManagementForm;
  management_company?: string;
  parking?: string;
  parking_fee?: number;
  bicycle_parking?: string;
  bike_parking?: string;
  common_facilities?: string[];
  // 用途地域・法規
  land_use_zone?: string;
  land_rights?: LandRights;
  building_coverage_ratio?: number;
  floor_area_ratio?: number;
  zoning?: string;
  // 管理手数料（rate=家賃の%、fixed=固定額（円））
  management_fee_type?: "rate" | "fixed";
  management_fee_rate?: number;
  management_fee_amount?: number;
  // 取引
  transaction_type?: TransactionType;
  // 自由入力
  notes?: string;
  appeal_points?: string;
  internal_memo?: string;
  // リレーション
  owner?: Owner;
  units?: Unit[];
}

export interface Unit {
  id: string;
  company_id: string;
  property_id: string;
  unit_number: string;
  floor?: number;
  layout?: string;
  area_sqm?: number;
  rent: number;
  management_fee: number;
  status: UnitStatus;
  property?: Property;
  current_contract?: Contract;
}

export interface Tenant {
  id: string;
  company_id: string;
  name: string;
  name_kana?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  postal_code?: string;
  address?: string;
  workplace?: string;
  workplace_phone?: string;
  annual_income?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  guarantee_type?: "company" | "individual" | "none";
  guarantee_company_name?: string;
  guarantee_contract_number?: string;
  guarantee_fee?: number;
  guarantor_name?: string;
  guarantor_name_kana?: string;
  guarantor_date_of_birth?: string;
  guarantor_phone?: string;
  guarantor_postal_code?: string;
  guarantor_address?: string;
  guarantor_workplace?: string;
  guarantor_workplace_phone?: string;
  guarantor_annual_income?: number;
  guarantor_relation?: string;
  notes?: string;
}

export interface Contract {
  id: string;
  company_id: string;
  unit_id: string;
  tenant_id: string;
  contract_type: ContractType;
  start_date: string;
  end_date?: string;
  rent: number;
  management_fee: number;
  status: ContractStatus;
  move_in_date?: string;
  move_out_date?: string;
  unit?: Unit;
  tenant?: Tenant;
}

export interface RentBilling {
  id: string;
  company_id: string;
  contract_id: string;
  billing_month: string;
  rent: number;
  management_fee: number;
  total_amount: number;
  due_date: string;
  status: BillingStatus;
  contract?: Contract;
}

export interface Case {
  id: string;
  company_id: string;
  property_id?: string;
  unit_id?: string;
  tenant_id?: string;
  title: string;
  description?: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  reported_date: string;
  completed_date?: string;
  vendor_name?: string;
  estimated_cost?: number;
  actual_cost?: number;
  source: "admin" | "tenant" | "portal";
  property?: Property;
  unit?: Unit;
  tenant?: Tenant;
}

export interface PropertyImage {
  id: string;
  file_name: string;
  file_path: string;
  url: string;
  mime_type: string;
  file_size: number;
  is_primary: boolean;
  created_at: string;
}

// ダッシュボード用
export interface DashboardStats {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;
  total_rent_expected: number;
  total_rent_received: number;
  collection_rate: number;
  overdue_count: number;
  overdue_amount: number;
  open_cases: number;
  expiring_contracts: number; // 3ヶ月以内に満了
}
