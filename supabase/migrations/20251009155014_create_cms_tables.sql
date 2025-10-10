/*
  # CMS Database Schema for SDS Taman Harapan
  
  1. New Tables
    - `homepage_settings` - Stores hero section content and welcome text
    - `about_us` - Vision, mission, and school description
    - `programs` - Academic programs and extracurricular activities
    - `facilities` - School facilities with descriptions
    - `achievements` - Student achievements and awards
    - `news` - News articles with rich content
    - `gallery_photos` - Photo gallery with captions
    - `gallery_videos` - Video gallery with embeds or file URLs
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
    
  3. Storage
    - Hero images, news thumbnails, gallery photos, and videos
*/

-- Homepage Settings
CREATE TABLE IF NOT EXISTS homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_title text NOT NULL DEFAULT '',
  welcome_description text NOT NULL DEFAULT '',
  hero_images jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read homepage settings"
  ON homepage_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update homepage settings"
  ON homepage_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert homepage settings"
  ON homepage_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- About Us
CREATE TABLE IF NOT EXISTS about_us (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vision text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE about_us ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read about us"
  ON about_us FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update about us"
  ON about_us FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert about us"
  ON about_us FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Programs
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_url text DEFAULT '',
  image_url text DEFAULT '',
  category text NOT NULL DEFAULT 'academic',
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read programs"
  ON programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete programs"
  ON programs FOR DELETE
  TO authenticated
  USING (true);

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  icon text DEFAULT '',
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read facilities"
  ON facilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert facilities"
  ON facilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update facilities"
  ON facilities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete facilities"
  ON facilities FOR DELETE
  TO authenticated
  USING (true);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  year integer NOT NULL,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update achievements"
  ON achievements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete achievements"
  ON achievements FOR DELETE
  TO authenticated
  USING (true);

-- News
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  thumbnail_url text DEFAULT '',
  published_date date NOT NULL DEFAULT CURRENT_DATE,
  author text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read news"
  ON news FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert news"
  ON news FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update news"
  ON news FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete news"
  ON news FOR DELETE
  TO authenticated
  USING (true);

-- Gallery Photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text DEFAULT '',
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gallery photos"
  ON gallery_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert gallery photos"
  ON gallery_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gallery photos"
  ON gallery_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete gallery photos"
  ON gallery_photos FOR DELETE
  TO authenticated
  USING (true);

-- Gallery Videos
CREATE TABLE IF NOT EXISTS gallery_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  video_url text DEFAULT '',
  embed_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gallery videos"
  ON gallery_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert gallery videos"
  ON gallery_videos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gallery videos"
  ON gallery_videos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete gallery videos"
  ON gallery_videos FOR DELETE
  TO authenticated
  USING (true);

-- Insert default homepage settings
INSERT INTO homepage_settings (welcome_title, welcome_description, hero_images)
VALUES (
  'Selamat Datang di SDS Taman Harapan',
  'Membangun generasi cerdas, berkarakter, dan berakhlak mulia',
  '[]'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert default about us
INSERT INTO about_us (vision, mission, description)
VALUES (
  'Menjadi sekolah dasar unggulan yang menghasilkan generasi cerdas, berkarakter, dan berakhlak mulia',
  'Menyelenggarakan pendidikan berkualitas dengan mengintegrasikan nilai-nilai agama, karakter, dan teknologi',
  'SDS Taman Harapan adalah lembaga pendidikan dasar yang berkomitmen untuk membentuk generasi masa depan yang cerdas, berkarakter, dan berakhlak mulia.'
) ON CONFLICT DO NOTHING;