/**
 * Script to scrape Instagram and TikTok posts and insert into Supabase.
 *
 * Usage: npx tsx scripts/sync-social-media.ts
 *
 * This script:
 * 1. Uses Playwright headless browser to visit Instagram and TikTok profiles
 * 2. Extracts recent post URLs
 * 3. Inserts them into social_media_posts table (skipping duplicates)
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const INSTAGRAM_URL = 'https://www.instagram.com/sds_taman_harapan/';
const TIKTOK_URL = 'https://www.tiktok.com/@sds.taman.harapan';

interface SocialPost {
  post_url: string;
  source: 'instagram' | 'tiktok';
  caption?: string;
  display_order: number;
}

async function scrapeInstagramPosts(browser: any): Promise<SocialPost[]> {
  console.log('\n📸 Scraping Instagram posts...');
  const page = await browser.newPage();
  const posts: SocialPost[] = [];

  try {
    // Instagram blocks headless browsers, so we use the embed/oembed approach
    // Visit the profile page and extract post links from the HTML
    await page.goto(INSTAGRAM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for content to load
    await page.waitForTimeout(5000);

    // Extract all links that match Instagram post pattern
    const postUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const postPattern = /\/p\/[a-zA-Z0-9_-]+/;
      const urls = new Set<string>();

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && postPattern.test(href)) {
          const fullUrl = `https://www.instagram.com${href}`;
          urls.add(fullUrl);
        }
      });

      return Array.from(urls).slice(0, 12); // Limit to 12 posts
    });

    for (const url of postUrls) {
      posts.push({
        post_url: url,
        source: 'instagram',
        display_order: posts.length,
      });
    }

    console.log(`   Found ${posts.length} Instagram posts`);
  } catch (error: any) {
    console.warn(`   ⚠️ Instagram scraping failed: ${error.message}`);
    console.warn('   This is common — Instagram blocks automated access.');
    console.warn('   Consider adding posts manually via CMS.');
  } finally {
    await page.close();
  }

  return posts;
}

async function scrapeTikTokPosts(browser: any): Promise<SocialPost[]> {
  console.log('\n🎵 Scraping TikTok posts...');
  const page = await browser.newPage();
  const posts: SocialPost[] = [];

  try {
    await page.goto(TIKTOK_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Extract video links
    const postUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const videoPattern = /\/@sds\.taman\.harapan\/video\/\d+/;
      const urls = new Set<string>();

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && videoPattern.test(href)) {
          const fullUrl = href.startsWith('http') ? href : `https://www.tiktok.com${href}`;
          urls.add(fullUrl);
        }
      });

      return Array.from(urls).slice(0, 12);
    });

    for (const url of postUrls) {
      posts.push({
        post_url: url,
        source: 'tiktok',
        display_order: posts.length,
      });
    }

    console.log(`   Found ${posts.length} TikTok posts`);
  } catch (error: any) {
    console.warn(`   ⚠️ TikTok scraping failed: ${error.message}`);
    console.warn('   This is common — TikTok blocks automated access.');
    console.warn('   Consider adding posts manually via CMS.');
  } finally {
    await page.close();
  }

  return posts;
}

async function syncPosts(posts: SocialPost[]) {
  console.log('\n💾 Syncing posts to database...');

  // Get existing posts to avoid duplicates
  const { data: existing, error: fetchError } = await supabase
    .from('social_media_posts')
    .select('post_url')
    .in(
      'post_url',
      posts.map((p) => p.post_url)
    );

  if (fetchError) {
    console.error('Error fetching existing posts:', fetchError.message);
    return;
  }

  const existingUrls = new Set((existing || []).map((p) => p.post_url));
  const newPosts = posts.filter((p) => !existingUrls.has(p.post_url));

  if (newPosts.length === 0) {
    console.log('   No new posts to add.');
    return;
  }

  console.log(`   ${newPosts.length} new posts to insert`);

  // Get current max display_order
  const { data: maxOrder } = await supabase
    .from('social_media_posts')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  let order = (maxOrder?.display_order || 0) + 1;

  for (const post of newPosts) {
    const { error } = await supabase.from('social_media_posts').insert({
      ...post,
      display_order: order++,
      is_active: true,
    });

    if (error) {
      console.error(`   Error inserting ${post.post_url}:`, error.message);
    } else {
      console.log(`   ✓ Added ${post.source}: ${post.post_url}`);
    }
  }
}

async function main() {
  console.log('🚀 Social Media Sync Script');
  console.log('==========================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const instagramPosts = await scrapeInstagramPosts(browser);
    const tiktokPosts = await scrapeTikTokPosts(browser);

    const allPosts = [...instagramPosts, ...tiktokPosts];
    console.log(`\n📊 Total posts found: ${allPosts.length}`);

    if (allPosts.length > 0) {
      await syncPosts(allPosts);
    } else {
      console.log('\n⚠️ No posts found. Both platforms may block automated access.');
      console.log('💡 Try adding posts manually via CMS at /admin/social-media');
    }
  } finally {
    await browser.close();
  }

  console.log('\n✅ Sync complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
