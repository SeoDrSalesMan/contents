-- Add new social media content fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS usar_historias BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS numero_historias INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usar_reels BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS numero_reels INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usar_carruseles BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS numero_carruseles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usar_post BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS numero_post INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emojis BOOLEAN DEFAULT true;
-- Note: Emojis defaults to true as it's generally preferred for social content
