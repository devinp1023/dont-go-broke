CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_assets NUMERIC NOT NULL DEFAULT 0,
  total_liabilities NUMERIC NOT NULL DEFAULT 0,
  net_worth NUMERIC NOT NULL DEFAULT 0,
  account_breakdown JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner only" ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_net_worth_snapshots_user_date ON net_worth_snapshots (user_id, date DESC);
