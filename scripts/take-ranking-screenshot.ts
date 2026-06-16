import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots');
const EMAIL = 'admin@sdstamanharapan.sch.id';
const PASSWORD = 'T@mHarPr10k2025';

async function main() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);

  const emailInput = page.locator('input[type="email"], input[id="email"]');
  await emailInput.first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"], button:has-text("Masuk")').first().click();
  await page.waitForTimeout(10000);
  console.log(`After login: ${page.url()}`);

  console.log('Navigating to ranking page...');
  await page.goto(`${BASE_URL}/admin/rankings`, { waitUntil: 'load', timeout: 60000 });

  try {
    await page.waitForSelector('main, aside, h1, h2, nav', { timeout: 15000 });
  } catch {
    await page.waitForTimeout(8000);
  }
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    console.log('WARNING: Redirected to login - not authenticated');
  }

  const filePath = path.join(SCREENSHOT_DIR, '15-ranking.png');
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
