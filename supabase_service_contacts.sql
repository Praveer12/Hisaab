-- ============================================================
-- SERVICE CONTACTS TABLE
-- Stores home service provider contacts with auto-categorization
-- ============================================================

CREATE TABLE IF NOT EXISTS service_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'other',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_service_contacts_category ON service_contacts(category);

-- Enable Row Level Security (adjust policies as needed for your auth setup)
-- ALTER TABLE service_contacts ENABLE ROW LEVEL SECURITY;

-- If you want public access (no auth), uncomment this:
-- CREATE POLICY "Allow all" ON service_contacts FOR ALL USING (true) WITH CHECK (true);
