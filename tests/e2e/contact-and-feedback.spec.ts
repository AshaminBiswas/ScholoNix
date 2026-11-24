import { test, expect } from "@playwright/test";

test.describe("Contact and Feedback Pages - Functionality, Responsiveness & Micro-interactions", () => {
  test.describe("Contact Page (/contact)", () => {
    test("Desktop: Loads correctly, validates form, and submits inquiry successfully", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/contact");

      // Verify Hero Heading & Badge
      await expect(
        page.getByRole("heading", { name: /Get in Touch with Our/i })
      ).toBeVisible();

      // Verify 3 Contact Channel Cards
      await expect(page.getByText("Direct Sales & Demo")).toBeVisible();
      await expect(page.getByText("Support & Helpdesk")).toBeVisible();
      await expect(page.getByText("Headquarters & Visits")).toBeVisible();

      // Test Form Validation: Try submitting empty form
      const submitBtn = page.getByRole("button", { name: /Submit Inquiry/i });
      await submitBtn.click();

      // Validation errors should appear
      await expect(page.getByText("Please enter your full name")).toBeVisible();
      await expect(page.getByText("Please enter a valid work or school email address")).toBeVisible();
      await expect(page.getByText("Message must be at least 10 characters long")).toBeVisible();

      // Fill in valid data
      await page.locator("#name").fill("Dr. Ananya Roy");
      await page.locator("#email").fill("ananya.roy@delhipublicschool.org");
      await page.locator("#phone").fill("+91 98765 12345");
      await page.locator("#schoolName").fill("Delhi Public School");
      await page.locator("#role").selectOption("Principal / Head of School");
      await page.locator("#subject").selectOption("Request a Product Demonstration");
      await page.locator("#message").fill(
        "We are looking to transition 1800 students to ScholoNix for the upcoming academic session. Please arrange a live demo."
      );

      // Submit Form
      await submitBtn.click();

      // Verify Celebration / Success State
      await expect(page.getByRole("heading", { name: "Message Received!" })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText(/Reference ID: CNTC-/i)).toBeVisible();

      // Verify "Send Another Inquiry" resets the form
      const resetBtn = page.getByRole("button", { name: /Send Another Inquiry/i });
      await resetBtn.click();
      await expect(page.getByRole("heading", { name: "Send Us an Inquiry" })).toBeVisible();
    });

    test("Mobile: Layout is responsive with no overflow, mobile menu works", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/contact");

      // Check no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Verify mobile hamburger menu
      const menuBtn = page.getByRole("button", { name: /Toggle navigation menu/i });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();

      // Check Mobile Menu contains Contact and Feedback links
      const mobileNav = page.locator("header nav").last();
      await expect(mobileNav.getByRole("link", { name: "Contact Us" })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "Share Feedback" })).toBeVisible();
    });
  });

  test.describe("Feedback Page (/feedback)", () => {
    test("Desktop: Category selection, interactive star rating, and submission work", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/feedback");

      // Verify Hero Heading
      await expect(
        page.getByRole("heading", { name: /Help Us Shape the/i })
      ).toBeVisible();

      // Verify Category Selector
      const featureRequestBtn = page.getByRole("button", { name: /Feature Request/i });
      await expect(featureRequestBtn).toBeVisible();
      await featureRequestBtn.click();

      // Click Star 4
      const star4 = page.locator("button[aria-label='Rate 4 out of 5 stars']");
      await star4.click();
      await expect(page.getByText("Very Good Experience")).toBeVisible();

      // Try submitting empty feedback
      const submitBtn = page.getByRole("button", { name: /Submit Feedback/i });
      await submitBtn.click();
      await expect(
        page.getByText("Please write at least 5 characters sharing your feedback")
      ).toBeVisible();

      // Fill valid feedback
      await page.locator("#feedbackText").fill(
        "It would be fantastic if teachers could import marks directly from an Excel spreadsheet into the CBSE report card template with one click."
      );
      await page.locator("#moduleUsed").selectOption("Exams, Marks & Report Cards");
      await page.locator("#role").selectOption("Teacher / Subject Educator");
      await page.locator("#schoolName").fill("Greenwood High");
      await page.locator("#email").fill("teacher@greenwood.edu");

      // Submit
      await submitBtn.click();

      // Verify Success State
      await expect(page.getByRole("heading", { name: "Feedback Submitted!" })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText(/Reference ID: FDBK-/i)).toBeVisible();

      // Verify community changelog section
      await expect(page.getByText("Recent Features Inspired by Community Feedback")).toBeVisible();
    });

    test("Mobile: Layout is responsive with no overflow", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/feedback");

      // Check no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Verify category chips are visible
      await expect(page.getByRole("button", { name: /Bug or Glitch/i })).toBeVisible();
    });
  });

  test.describe("API Endpoints", () => {
    test("POST /api/contact validates input correctly", async ({ request }) => {
      // Invalid input
      const resBad = await request.post("/api/contact", {
        data: { name: "", email: "notanemail", subject: "", message: "hi" },
      });
      expect(resBad.status()).toBe(400);
      const jsonBad = await resBad.json();
      expect(jsonBad.success).toBe(false);

      // Valid input
      const resGood = await request.post("/api/contact", {
        data: {
          name: "Principal Sharma",
          email: "principal@testschool.edu",
          subject: "Pricing Inquiry",
          message: "Please send us pricing for 1500 students.",
        },
      });
      expect(resGood.status()).toBe(200);
      const jsonGood = await resGood.json();
      expect(jsonGood.success).toBe(true);
      expect(jsonGood.referenceId).toMatch(/^CNTC-/);
    });

    test("POST /api/feedback validates input correctly", async ({ request }) => {
      // Invalid input
      const resBad = await request.post("/api/feedback", {
        data: { category: "InvalidCategory", rating: 6, feedback: "abc" },
      });
      expect(resBad.status()).toBe(400);

      // Valid input
      const resGood = await request.post("/api/feedback", {
        data: {
          category: "Feature Request",
          rating: 5,
          feedback: "Love the new interface, please add bulk SMS dispatch.",
          email: "admin@testschool.edu",
        },
      });
      expect(resGood.status()).toBe(200);
      const jsonGood = await resGood.json();
      expect(jsonGood.success).toBe(true);
      expect(jsonGood.referenceId).toMatch(/^FDBK-/);
    });
  });
});
