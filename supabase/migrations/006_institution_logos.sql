-- Add institution_id and logo to plaid_items
ALTER TABLE plaid_items ADD COLUMN institution_id TEXT;
ALTER TABLE plaid_items ADD COLUMN institution_logo TEXT;
