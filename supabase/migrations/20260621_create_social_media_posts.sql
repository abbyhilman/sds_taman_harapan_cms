-- Social Media Posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text CHECK (source IN ('instagram', 'tiktok')),
  post_url text NOT NULL,
  embed_code text,
  thumbnail_url text,
  caption text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- Add unique constraint on post_url to prevent duplicates
ALTER TABLE social_media_posts ADD CONSTRAINT social_media_posts_post_url_key UNIQUE (post_url);

-- Public read access
CREATE POLICY "Allow public read access to active social media posts"
  ON social_media_posts
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admin CRUD access
CREATE POLICY "Allow authenticated users full access to social media posts"
  ON social_media_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_social_media_posts_display_order ON social_media_posts(display_order);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_is_active ON social_media_posts(is_active);

-- Seed data: TikTok posts
INSERT INTO social_media_posts (source, post_url, caption, display_order) VALUES
  ('tiktok', 'https://vt.tiktok.com/ZSQKU3TnT/', 'Video TikTok SDS Taman Harapan 1', 0),
  ('tiktok', 'https://vt.tiktok.com/ZSQKUubr4/', 'Video TikTok SDS Taman Harapan 2', 1),
  ('tiktok', 'https://vt.tiktok.com/ZSQKUsYdb/', 'Video TikTok SDS Taman Harapan 3', 2)
ON CONFLICT (post_url) DO NOTHING;

-- Seed data: Instagram posts
INSERT INTO social_media_posts (source, post_url, caption, display_order) VALUES
  ('instagram', 'https://www.instagram.com/p/DYld_MgxlA-/?igsh=MWlpYmhsNjZ5ZGsyYQ==', 'Instagram Post SDS Taman Harapan 1', 3),
  ('instagram', 'https://www.instagram.com/p/DZW8BrGRfby/?igsh=NGg1emVwcncyeGtx', 'Instagram Post SDS Taman Harapan 2', 4)
ON CONFLICT (post_url) DO NOTHING;
