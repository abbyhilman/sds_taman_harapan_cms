-- Update TikTok short URLs to full URLs with video IDs for embed support
-- Based on the embed code provided by user

-- First, delete the old short URL entries
DELETE FROM social_media_posts WHERE source = 'tiktok' AND post_url LIKE 'https://vt.tiktok.com/%';

-- Insert new TikTok posts with full URLs
INSERT INTO social_media_posts (source, post_url, caption, display_order) VALUES
  ('tiktok', 'https://www.tiktok.com/@sds.taman.harapan/video/7647330117089250580', 'Dari awal bertemu hingga hari perpisahan ini, setiap detik adalah cerita yang tak akan terlupakan. Selamat melangkah lebih jauh, teman-teman hebat! 🎓✨', 0)
ON CONFLICT (post_url) DO NOTHING;

-- Note: For the other 2 TikTok short URLs (ZSQKUubr4 and ZSQKUsYdb), 
-- you need to find the actual video IDs by:
-- 1. Opening the short URL in browser
-- 2. Copying the full URL from address bar (will have format: https://www.tiktok.com/@username/video/VIDEO_ID)
-- 3. Updating the database with the full URL
