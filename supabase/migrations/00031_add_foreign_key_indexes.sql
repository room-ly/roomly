-- 外部キーカラムにインデックスを追加（クエリ高速化）

create index if not exists idx_contracts_unit_id on public.contracts(unit_id);
create index if not exists idx_contracts_tenant_id on public.contracts(tenant_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_units_property_id on public.units(property_id);
create index if not exists idx_maintenance_requests_unit_id on public.maintenance_requests(unit_id);
create index if not exists idx_maintenance_requests_status on public.maintenance_requests(status);
create index if not exists idx_documents_property_id on public.documents(property_id);
create index if not exists idx_rent_billings_contract_id on public.rent_billings(contract_id);
create index if not exists idx_rent_billings_status on public.rent_billings(status);
create index if not exists idx_inquiry_logs_inquiry_id on public.inquiry_logs(inquiry_id);
create index if not exists idx_maintenance_logs_request_id on public.maintenance_logs(request_id);
create index if not exists idx_owner_remittances_owner_id on public.owner_remittances(owner_id);
create index if not exists idx_owner_remittance_items_remittance_id on public.owner_remittance_items(remittance_id);
create index if not exists idx_inquiries_status on public.inquiries(status);
create index if not exists idx_expenses_property_id on public.expenses(property_id);
