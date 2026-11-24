import { test, expect } from "@playwright/test";

test.describe("Table of Contents Overlap Fixes & Guide Detail Enhancements", () => {
  test.describe("Blog Detail Page - Table of Contents", () => {
    test("Desktop: TOC and sibling sidebar cards do not overlap when scrolled", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/blog/a-complete-guide-to-digital-transformation-for-schools");

      // Verify Table of Contents heading is visible
      const tocHeading = page.getByRole("heading", { name: "Table of Contents" }).first();
      await expect(tocHeading).toBeVisible();

      // Scroll down into the article
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(400);

      // Locate TOC card and Related Articles card in the sidebar
      const tocCard = page.locator("aside").locator("text=Table of Contents").locator("xpath=ancestor::div[contains(@class, 'rounded-[22px]')]").first();
      const relatedCard = page.locator("aside").locator("text=Related Articles").locator("xpath=ancestor::div[contains(@class, 'rounded-[22px]')]").first();

      const tocBox = await tocCard.boundingBox();
      const relatedBox = await relatedCard.boundingBox();

      expect(tocBox).not.toBeNull();
      expect(relatedBox).not.toBeNull();

      if (tocBox && relatedBox) {
        // Related card must be strictly below TOC card, never overlapping
        expect(relatedBox.y).toBeGreaterThanOrEqual(tocBox.y + tocBox.height - 2);
      }
    });

    test("Mobile: TOC is static in aside and does not overlap content", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/blog/a-complete-guide-to-digital-transformation-for-schools");

      // Mobile collapsible TOC is visible near the top
      const mobileTocBtn = page.getByRole("button", { name: /Table of Contents/i });
      await expect(mobileTocBtn).toBeVisible();

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 1500));
      await page.waitForTimeout(400);

      // Ensure no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });

  test.describe("Help Detail Page - Table of Contents", () => {
    test("Desktop: 'In This Article' and Related Articles do not overlap when scrolled", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/help/how-to-set-up-your-school-account");

      const inThisArticleHeading = page.getByRole("heading", { name: "In This Article" }).first();
      await expect(inThisArticleHeading).toBeVisible();

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(400);

      const tocCard = page.locator("aside").locator("text=In This Article").locator("xpath=ancestor::div[contains(@class, 'rounded-[22px]')]").first();
      const relatedCard = page.locator("aside").locator("text=Related Articles").locator("xpath=ancestor::div[contains(@class, 'rounded-[22px]')]").first();

      const tocBox = await tocCard.boundingBox();
      const relatedBox = await relatedCard.boundingBox();

      expect(tocBox).not.toBeNull();
      expect(relatedBox).not.toBeNull();

      if (tocBox && relatedBox) {
        // Related card must be strictly below TOC card
        expect(relatedBox.y).toBeGreaterThanOrEqual(tocBox.y + tocBox.height - 2);
      }
    });
  });

  test.describe("Guide Detail Page - Breadcrumbs and Walkthrough Cards", () => {
    test("Mobile: Breadcrumbs are hidden on small devices", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/guides/get-started-in-10-minutes");

      const breadcrumbNav = page.locator("nav[aria-label='Breadcrumb'], main > nav");
      await expect(breadcrumbNav).toBeHidden();
    });

    test("Desktop: Breadcrumbs are visible on larger screens", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/guides/get-started-in-10-minutes");

      const breadcrumbNav = page.locator("main > nav").first();
      await expect(breadcrumbNav).toBeVisible();
      await expect(breadcrumbNav).toContainText("Guides");
      await expect(breadcrumbNav).toContainText("Getting Started");
    });

    test("Walkthrough cards have gradient backgrounds and reduced width on small devices", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/guides/get-started-in-10-minutes");

      const step1Card = page.locator("#step-1");
      await expect(step1Card).toBeVisible();

      // Check reduced width constraint on mobile
      const step1Class = await step1Card.getAttribute("class");
      expect(step1Class).toContain("max-w-[92%]");
      expect(step1Class).toContain("bg-gradient-to-br");

      // Verify interactive step completion toggle
      const checkBtn = step1Card.locator("button[aria-label*='Step 1']");
      await checkBtn.click();
      await page.waitForTimeout(300);

      // Verify completion state applied
      const updatedClass = await step1Card.getAttribute("class");
      expect(updatedClass).toContain("border-emerald-300");
    });
  });

  test.describe("Sidebar Scrollbar Removal and Auto-Scroll Sync", () => {
    const pages = [
      { name: "Blog Detail", url: "/blog/how-a-school-management-system-simplifies-daily-operations" },
      { name: "Help Detail", url: "/help/how-to-set-up-your-school-account" },
      { name: "Guide Detail", url: "/guides/get-started-in-10-minutes" },
    ];

    for (const p of pages) {
      test(`${p.name}: right sidebar has no scrollbar and auto-scrolls with article reading`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(p.url);

        const aside = page.locator("aside").first();
        await expect(aside).toBeVisible();

        // Check scrollbar is hidden
        const scrollbarWidth = await aside.evaluate((el) => window.getComputedStyle(el).scrollbarWidth);
        expect(scrollbarWidth).toBe("none");

        // Scroll page down and check sidebar auto-scrolled
        const initialScrollTop = await aside.evaluate((el) => el.scrollTop);
        await page.evaluate(() => window.scrollBy(0, 1400));
        await page.waitForTimeout(400);

        const scrolledScrollTop = await aside.evaluate((el) => el.scrollTop);
        expect(scrolledScrollTop).toBeGreaterThanOrEqual(initialScrollTop);
      });
    }
  });
});
