CREATE TABLE move_out_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  item_name text NOT NULL,
  is_checked boolean NOT NULL DEFAULT false,
  notes text,
  checked_at timestamptz,
  checked_by uuid REFERENCES users(id),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE move_out_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY move_out_checklist_tenant_policy ON move_out_checklist_items
  USING (company_id = public.company_id())
  WITH CHECK (company_id = public.company_id());

CREATE INDEX idx_checklist_company ON move_out_checklist_items (company_id);
CREATE INDEX idx_checklist_contract ON move_out_checklist_items (contract_id);
