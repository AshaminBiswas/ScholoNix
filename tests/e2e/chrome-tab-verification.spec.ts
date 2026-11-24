import { test, expect } from "@playwright/test";
import * as path from "path";

const LOGO_EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/logo_evidence"
);

test.describe("Chrome Tab Favicon Verification", () => {
  test("Verify favicon links and visual Chrome tab preview", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 400 });

    // 1. Visit the app home page
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Verify all icon links exist in document head
    const favicon32 = await page.locator('link[rel="icon"][sizes="32x32"]').getAttribute("href");
    const favicon16 = await page.locator('link[rel="icon"][type="image/png"][sizes="16x16"]').getAttribute("href");
    const icon512 = await page.locator('link[rel="icon"][sizes="512x512"]').getAttribute("href");
    const shortcut = await page.locator('link[rel="shortcut icon"]').getAttribute("href");

    expect(favicon32).toBe("/favicon-32x32.png");
    expect(favicon16).toBe("/favicon-16x16.png");
    expect(icon512).toBe("/icon.png");
    expect(shortcut).toBe("/favicon.ico");

    // 2. Render an exact pixel-accurate Google Chrome Tab UI simulation
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            body {
              background: #0f172a;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .chrome-window {
              width: 900px;
              background: #DFE1E5;
              border-radius: 10px;
              box-shadow: 0 25px 60px rgba(0,0,0,0.4);
              overflow: hidden;
            }
            .chrome-titlebar {
              height: 42px;
              display: flex;
              align-items: flex-end;
              padding-left: 10px;
              padding-right: 10px;
              position: relative;
            }
            .window-controls {
              display: flex;
              gap: 8px;
              padding-bottom: 12px;
              padding-left: 6px;
              padding-right: 12px;
            }
            .dot { width: 12px; height: 12px; border-radius: 50%; }
            .dot-close { background: #FF5F56; }
            .dot-min { background: #FFBD2E; }
            .dot-max { background: #27C93F; }

            .chrome-tab-active {
              background: #FFFFFF;
              height: 34px;
              width: 250px;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
              display: flex;
              align-items: center;
              padding: 0 12px;
              gap: 10px;
              box-shadow: 0 -1px 3px rgba(0,0,0,0.06);
              position: relative;
            }
            .favicon-img {
              width: 18px;
              height: 18px;
              object-fit: contain;
              border-radius: 2px;
            }
            .tab-title {
              font-size: 12px;
              color: #3C4043;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 1;
            }
            .tab-close {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              color: #5F6368;
              font-size: 11px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            }
            .chrome-tab-inactive {
              height: 34px;
              width: 180px;
              display: flex;
              align-items: center;
              padding: 0 12px;
              gap: 8px;
              opacity: 0.7;
            }
            .chrome-omnibox-bar {
              background: #FFFFFF;
              padding: 8px 14px;
              display: flex;
              align-items: center;
              gap: 12px;
              border-bottom: 1px solid #E8EAED;
            }
            .nav-buttons {
              display: flex;
              gap: 10px;
              color: #5F6368;
              font-size: 14px;
            }
            .omnibox {
              flex: 1;
              background: #F1F3F4;
              height: 30px;
              border-radius: 16px;
              display: flex;
              align-items: center;
              padding: 0 14px;
              font-size: 13px;
              color: #202124;
              gap: 8px;
            }
            .lock-icon {
              color: #1E8E3E;
              font-size: 11px;
            }
            .omnibox-url {
              font-weight: 400;
            }
            .preview-canvas {
              height: 120px;
              background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 24px;
              padding: 20px;
            }
            .preview-card {
              background: #ffffff;
              padding: 12px 20px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 12px;
              box-shadow: 0 4px 12px rgba(102,60,246,0.1);
              border: 1px solid #E2E8F0;
            }
            .card-title {
              font-size: 13px;
              font-weight: 700;
              color: #08093B;
            }
            .card-subtitle {
              font-size: 11px;
              color: #64748B;
            }
          </style>
        </head>
        <body>
          <div class="chrome-window">
            <div class="chrome-titlebar">
              <div class="window-controls">
                <span class="dot dot-close"></span>
                <span class="dot dot-min"></span>
                <span class="dot dot-max"></span>
              </div>
              <div class="chrome-tab-active">
                <img class="favicon-img" src="http://localhost:3000/favicon-32x32.png" alt="Favicon" />
                <span class="tab-title">ScholoNix | Run Your School Smarter, Simpler &amp; More Efficiently</span>
                <span class="tab-close">✕</span>
              </div>
              <div class="chrome-tab-inactive">
                <span style="font-size: 12px; color: #5F6368;">Features - ScholoNix</span>
              </div>
            </div>
            <div class="chrome-omnibox-bar">
              <div class="nav-buttons">
                <span>←</span>
                <span>→</span>
                <span>↻</span>
              </div>
              <div class="omnibox">
                <span class="lock-icon">🔒</span>
                <span class="omnibox-url">https://scholonix.com</span>
              </div>
            </div>
            <div class="preview-canvas">
              <div class="preview-card">
                <img src="http://localhost:3000/favicon-16x16.png" style="width: 16px; height: 16px;" alt="16px" />
                <div>
                  <div class="card-title">16x16 Favicon</div>
                  <div class="card-subtitle">Standard Chrome Tab Size</div>
                </div>
              </div>
              <div class="preview-card">
                <img src="http://localhost:3000/favicon-32x32.png" style="width: 32px; height: 32px;" alt="32px" />
                <div>
                  <div class="card-title">32x32 Favicon</div>
                  <div class="card-subtitle">Retina / HiDPI Chrome Tab Size</div>
                </div>
              </div>
              <div class="preview-card">
                <img src="http://localhost:3000/apple-icon.png" style="width: 48px; height: 48px; border-radius: 8px;" alt="180px" />
                <div>
                  <div class="card-title">High-Res Touch & App Icon</div>
                  <div class="card-subtitle">PWA & Bookmarks</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(600);

    const screenshotPath = path.join(LOGO_EVIDENCE_DIR, "08_chrome_tab_favicon.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log("Saved Chrome tab preview to:", screenshotPath);
  });
});
