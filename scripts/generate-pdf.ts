import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('Generating PDF...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlPath = path.resolve('docs', 'panduan-cms.html');
  const pdfPath = path.resolve('docs', 'Panduan-Penggunaan-CMS-SDS-Taman-Harapan.pdf');

  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'load',
    timeout: 30000,
  });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm',
    },
    displayHeaderFooter: false,
  });

  console.log(`✅ PDF generated: ${pdfPath}`);
  await browser.close();
}

main().catch(console.error);
