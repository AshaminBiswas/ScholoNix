import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { renderOtpEmailHtml } from '../src/server/notifications/email-template.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePreview() {
  console.log('Starting preview generation...');

  const logoPath = path.join(process.cwd(), 'public/images/scholonix-logo.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const htmlWithDataUri = renderOtpEmailHtml({
    code: '544690',
    purpose: 'REGISTRATION',
    expiresInMinutes: 5,
    logoUrl: logoDataUri,
  });

  const previewDir = path.join(process.cwd(), 'public');
  const previewHtmlPath = path.join(previewDir, 'preview-email-test.html');
  fs.writeFileSync(previewHtmlPath, htmlWithDataUri, 'utf8');
  console.log(`Wrote preview HTML to ${previewHtmlPath}`);

  const browser = await chromium.launch({ headless: true });

  // 1. Mobile viewport (360 x 780 - typical modern Android phone like in user's screenshot)
  const mobileContext = await browser.newContext({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`file://${previewHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });

  const evidenceDir = 'C:/Users/asham/.gemini/antigravity/brain/5027b5c1-11f9-4b7f-a70b-a558d7c45785/evidence';
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const mobileScreenshotPath = path.join(evidenceDir, 'email_with_logo_mobile_360.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
  console.log(`Saved mobile screenshot to ${mobileScreenshotPath}`);

  // 2. Mobile viewport (375 x 812 - iPhone)
  const iphoneContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const iphonePage = await iphoneContext.newPage();
  await iphonePage.goto(`file://${previewHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  const iphoneScreenshotPath = path.join(evidenceDir, 'email_with_logo_iphone_375.png');
  await iphonePage.screenshot({ path: iphoneScreenshotPath, fullPage: true });
  console.log(`Saved iPhone screenshot to ${iphoneScreenshotPath}`);

  // 3. Desktop viewport (800 x 700)
  const desktopContext = await browser.newContext({
    viewport: { width: 800, height: 700 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`file://${previewHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  const desktopScreenshotPath = path.join(evidenceDir, 'email_with_logo_desktop.png');
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: true });
  console.log(`Saved desktop screenshot to ${desktopScreenshotPath}`);

  await browser.close();
  console.log('Preview generation complete!');
}

generatePreview().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
