-- Securities: shared reference data for investment positions
CREATE TABLE securities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_security_id TEXT UNIQUE NOT NULL,
  name TEXT,
  ticker_symbol TEXT,
  type TEXT,
  close_price NUMERIC,
  close_price_as_of DATE,
  is_cash_equivalent BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holdings: per-user investment positions
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  institution_value NUMERIC NOT NULL,
  institution_price NUMERIC NOT NULL,
  cost_basis NUMERIC,
  iso_currency_code TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, security_id)
);

-- RLS for securities (shared reference data, any authenticated user can read/write)
ALTER TABLE securities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON securities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated write" ON securities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON securities FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS for holdings (owner only)
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner only" ON holdings FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_holdings_account ON holdings (account_id);
CREATE INDEX idx_holdings_user ON holdings (user_id);
CREATE INDEX idx_securities_plaid_id ON securities (plaid_security_id);
