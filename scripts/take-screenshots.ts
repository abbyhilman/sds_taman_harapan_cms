import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots');
const EMAIL = 'admin@sdstamanharapan.sch.id';
const PASSWORD = 'T@mHarPr10k2025';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page: Page, name: string, fullPage = false) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Warm up dev server with homepage
  console.log('\n1. Warming up dev server...');
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  const homeText = await page.evaluate(() => document.body?.innerText?.substring(0, 100) || '');
  console.log(`  Homepage: ${homeText.substring(0, 50)}...`);

  // Navigate to login
  console.log('\n2. Navigating to login...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'load', timeout: 60000 });

  // Wait for React to hydrate - look for any rendered content
  await page.waitForTimeout(10000);

  const loginUrl = page.url();
  console.log(`  URL: ${loginUrl}`);

  // Check all inputs on the page
  const allInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, button, a[href]'));
    return inputs.map(el => ({
      tag: el.tagName.toLowerCase(),
      type: (el as HTMLInputElement).type || '',
      text: el.textContent?.trim().substring(0, 50) || '',
      href: (el as HTMLAnchorElement).href || '',
      placeholder: (el as HTMLInputElement).placeholder || '',
    }));
  });
  console.log(`  Elements found: ${allInputs.length}`);
  allInputs.forEach((el, i) => {
    if (el.tag === 'input') console.log(`    [${i}] input type=${el.type} placeholder="${el.placeholder}"`);
    else if (el.tag === 'button') console.log(`    [${i}] button "${el.text}"`);
    else if (el.tag === 'a' && el.href) console.log(`    [${i}] a href="${el.href}" "${el.text}"`);
  });

  // Try to find email input
  const emailInput = page.locator('input[type="email"], input[id="email"], input[name="email"], input[placeholder*="email" i]');
  const emailCount = await emailInput.count();
  console.log(`\n  Email inputs found: ${emailCount}`);

  if (emailCount > 0) {
    // Login form found - take screenshot, fill, and submit
    await screenshot(page, '01-login', true);

    console.log('\n3. Logging in...');
    await emailInput.first().fill(EMAIL);
    const passInput = page.locator('input[type="password"], input[id="password"], input[name="password"]');
    await passInput.first().fill(PASSWORD);

    const submitBtn = page.locator('button[type="submit"], button:has-text("Masuk")');
    await submitBtn.first().click();

    // Wait for navigation after login
    await page.waitForTimeout(10000);
    console.log(`  After login URL: ${page.url()}`);
  } else {
    // Login form not found - try clicking "Masuk Admin" link from homepage
    console.log('\n  Login form not found. Trying via homepage link...');
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Look for admin login link
    const adminLink = page.locator('a:has-text("Admin"), a:has-text("Masuk"), a[href*="login"], a[href*="admin"]');
    const linkCount = await adminLink.count();
    console.log(`  Admin links found: ${linkCount}`);

    if (linkCount > 0) {
      await adminLink.first().click();
      await page.waitForTimeout(10000);
      console.log(`  After clicking link, URL: ${page.url()}`);

      // Try again to find login form
      const emailInput2 = page.locator('input[type="email"], input[id="email"]');
      if (await emailInput2.count() > 0) {
        await screenshot(page, '01-login', true);
        await emailInput2.first().fill(EMAIL);
        await page.locator('input[type="password"]').first().fill(PASSWORD);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(10000);
        console.log(`  After login URL: ${page.url()}`);
      } else {
        await screenshot(page, '01-login', true);
        console.log('  ⚠ Still no login form found');
      }
    } else {
      await screenshot(page, '01-login', true);
      console.log('  ⚠ No admin link or login form found');
    }
  }

  // Take screenshots of all admin pages
  console.log('\n4. Taking page screenshots...');
  const pages: [string, string][] = [
    ['02-dashboard', '/admin/dashboard'],
    ['03-content-homepage', '/admin/content/homepage'],
    ['04-content-about', '/admin/content/about'],
    ['05-content-programs', '/admin/content/programs'],
    ['06-content-news', '/admin/content/news'],
    ['07-content-ppdb', '/admin/content/ppdb'],
    ['08-students', '/admin/students'],
    ['09-report-cards', '/admin/report-cards'],
    ['10-master-data', '/admin/master-data'],
    ['11-financial', '/admin/financial'],
    ['12-gallery-photos', '/admin/gallery/photos'],
    ['13-settings-school-profile', '/admin/settings/school-profile'],
    ['14-users', '/admin/users'],
  ];

  for (const [name, url] of pages) {
    console.log(`\n  ${name}:`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'load', timeout: 60000 });

    // Wait for content to render
    try {
      await page.waitForSelector('main, aside, h1, h2, nav, [role="navigation"]', { timeout: 15000 });
    } catch {
      // fallback wait
      await page.waitForTimeout(8000);
    }
    await page.waitForTimeout(3000);

    // Check if we got redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log(`    ⚠ Redirected to login - not authenticated`);
    }

    const pageText = await page.evaluate(() => document.body?.innerText?.substring(0, 80) || 'empty');
    console.log(`    Content: ${pageText.substring(0, 50)}...`);

    await screenshot(page, name, true);
  }

  console.log('\n✅ Done!');
  await browser.close();
}

main().catch(console.error);
