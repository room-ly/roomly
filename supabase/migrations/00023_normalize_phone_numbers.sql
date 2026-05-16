-- 電話番号からハイフン・スペース・括弧を除去して数字のみに正規化
UPDATE tenants SET phone = regexp_replace(phone, '[^0-9]', '', 'g') WHERE phone IS NOT NULL AND phone ~ '[^0-9]';
UPDATE tenants SET emergency_contact_phone = regexp_replace(emergency_contact_phone, '[^0-9]', '', 'g') WHERE emergency_contact_phone IS NOT NULL AND emergency_contact_phone ~ '[^0-9]';
UPDATE owners SET phone = regexp_replace(phone, '[^0-9]', '', 'g') WHERE phone IS NOT NULL AND phone ~ '[^0-9]';
UPDATE companies SET phone = regexp_replace(phone, '[^0-9]', '', 'g') WHERE phone IS NOT NULL AND phone ~ '[^0-9]';
UPDATE tenants SET guarantor_phone = regexp_replace(guarantor_phone, '[^0-9]', '', 'g') WHERE guarantor_phone IS NOT NULL AND guarantor_phone ~ '[^0-9]';
