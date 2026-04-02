CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  generated_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner only" ON insights FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX insights_user_date ON insights(user_id, generated_date);
