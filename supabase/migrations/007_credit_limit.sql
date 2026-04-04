-- Add credit limit to accounts for utilization calculation
ALTER TABLE accounts ADD COLUMN credit_limit NUMERIC;
