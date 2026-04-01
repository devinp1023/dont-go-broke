-- Users table is handled by Supabase Auth (auth.users)
-- All tables reference auth.uid() for RLS

CREATE TABLE plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
  plaid_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  subtype TEXT,
  current_balance NUMERIC,
  available_balance NUMERIC,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  merchant_name TEXT,
  category TEXT,
  plaid_category JSONB,
  pending BOOLEAN DEFAULT FALSE,
  notes TEXT,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on all tables
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only" ON plaid_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owner only" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owner only" ON transactions FOR ALL USING (auth.uid() = user_id);
