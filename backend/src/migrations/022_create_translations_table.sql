-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
    key VARCHAR(255) PRIMARY KEY,
    en TEXT,
    th TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups (though PK is indexed by default)
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_translations_updated_at ON public.translations;
CREATE TRIGGER update_translations_updated_at
    BEFORE UPDATE ON public.translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
