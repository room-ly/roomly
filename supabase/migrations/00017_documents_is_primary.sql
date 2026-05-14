ALTER TABLE documents ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX idx_documents_primary_property
  ON documents (property_id)
  WHERE is_primary = true AND unit_id IS NULL AND document_type = 'photo';

CREATE UNIQUE INDEX idx_documents_primary_unit
  ON documents (unit_id)
  WHERE is_primary = true AND unit_id IS NOT NULL AND document_type = 'photo';
