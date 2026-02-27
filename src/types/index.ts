export type UserRole = "admin" | "manager" | "staff" | "viewer";

export type PropertyType = "apartment" | "house" | "commercial" | "parking";

export type UnitStatus = "vacant" | "occupied" | "reserved" | "maintenance";

export type ContractStatus = "active" | "expired" | "terminated" | "pending";

export type ContractType = "fixed" | "ordinary";

export type BillingStatus = "unpaid" | "partial" | "paid" | "overdue";

export type PaymentMethod = "transfer" | "card" | "cash" | "debit";

export type MaintenancePriority = "low" | "normal" | "high" | "urgent";

export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "waiting_parts"
  | "completed"
  | "cancelled";

export type InquiryType =
  | "general"
  | "complaint"
  | "noise"
  | "facility"
  | "move_out"
  | "other";

export type InquiryStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Company {
  id: string;
  name: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  plan: "free" | "pro";
  max_units: number;
}

export interface Owner {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  email?: string;
  management_fee_rate: number;
}

export interface Property {
  id: string;
  company_id: string;
  owner_id: string;
  name: string;
  property_type: PropertyType;
  address: string;
  structure?: string;
  floors?: number;
  built_year?: number;
  total_units?: number;
  nearest_station?: string;
  walk_minutes?: number;
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
  phone?: string;
  email?: string;
  workplace?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
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

export interface MaintenanceRequest {
  id: string;
  company_id: string;
  property_id: string;
  unit_id?: string;
  tenant_id?: string;
  title: string;
  description?: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reported_date: string;
  completed_date?: string;
  vendor_name?: string;
  estimated_cost?: number;
  actual_cost?: number;
  property?: Property;
  unit?: Unit;
  tenant?: Tenant;
}

export interface Inquiry {
  id: string;
  company_id: string;
  property_id?: string;
  unit_id?: string;
  tenant_id?: string;
  inquiry_type: InquiryType;
  title: string;
  description?: string;
  status: InquiryStatus;
  priority: MaintenancePriority;
  created_at: string;
  property?: Property;
  tenant?: Tenant;
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
  open_maintenance: number;
  open_inquiries: number;
  expiring_contracts: number; // 3ヶ月以内に満了
}
