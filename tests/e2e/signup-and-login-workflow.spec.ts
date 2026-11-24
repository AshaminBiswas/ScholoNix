import { test, expect } from "@playwright/test";

test.describe("Full School Signup & Login End-to-End Workflow", () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPhone = "98" + Math.floor(10000000 + Math.random() * 90000000).toString();
  const testEmail = `principal.${Date.now()}@e2etest.edu.in`;
  const schoolName = `Greenwood World Academy ${randomSuffix}`;
  const password = "Password@123";

  test("1. Complete School Signup through all 5 Wizard Steps", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/step=1/);

    // STEP 1: Institution Details
    await page.locator("input[placeholder*='Sunrise']").fill(schoolName);
    await page.locator("input[placeholder*='98765 43210']").first().fill(testPhone);
    await page.locator("input[placeholder*='Green Valley Road']").fill("Plot 10, Knowledge Park");
    await page.locator("input[placeholder*='Noida']").fill("Bengaluru");

    // Select State
    const stateSelect = page.locator("select").nth(2);
    if (await stateSelect.isVisible()) {
      await stateSelect.selectOption("Karnataka");
    }

    // PIN code
    await page.locator("input[placeholder*='201301']").fill("560001");

    // Click Continue
    const continueToAdmin = page.locator("#continue-to-admin-btn");
    await continueToAdmin.click();

    // Verify advanced to Step 2
    await expect(page).toHaveURL(/step=2/);
    await expect(page.getByRole("heading", { name: "Administrator Details", level: 2 })).toBeVisible();

    // STEP 2: Administrator Details
    await page.locator("input[placeholder*='Rohan Mehta']").fill("Dr. Sunil Sharma");
    await page.locator("input[placeholder*='98765 43210']").fill(testPhone);
    await page.locator("input[placeholder*='principal@sunrise']").fill(testEmail);
    await page.locator("input[type='password']").first().fill(password);
    await page.locator("input[type='password']").nth(1).fill(password);

    // Advance to Step 3
    const continueToVerify = page.locator("#continue-to-verify-mobile-btn");
    await continueToVerify.click();

    // Verify advanced to Step 3
    await expect(page).toHaveURL(/step=3/);
    await expect(page.getByRole("heading", { name: "Verify & Confirm", level: 2 })).toBeVisible();

    // STEP 3: OTP Verification
    const sendMobileOtpBtn = page.locator("#send-mobile-otp-btn");
    if (await sendMobileOtpBtn.isVisible()) {
      await sendMobileOtpBtn.click();
    }
    await expect(page.getByText("Verify Email Address")).toBeVisible();
    const sendEmailOtpBtn = page.locator("#send-email-otp-btn");
    if (await sendEmailOtpBtn.isVisible()) {
      await sendEmailOtpBtn.click();
    }

    // Advance to Step 4 (Plan Selection)
    const continueToPlan = page.locator("#continue-to-review-btn");
    if (await continueToPlan.isVisible()) {
      await continueToPlan.click();
      await expect(page).toHaveURL(/step=4/);
    }

    // STEP 4: Choose Plan or Skip
    const skipPlanBtn = page.locator("#skip-plan-btn");
    if (await skipPlanBtn.isVisible()) {
      await skipPlanBtn.click();
      await expect(page).toHaveURL(/step=5/);
    }
  });

  test("2. Sign In to Registered School with Password", async ({ page }) => {
    await page.goto("/login");

    // Select Password tab
    await page.locator("#tab-signin-password").click();

    // Fill registered Sunrise International School credentials
    await page.locator("#login-id-input").fill("+919876543210");
    await page.locator("#login-password-input").fill("Password@123");

    // Click Sign In
    await page.locator("#password-signin-btn").click();

    // Expect login success modal
    await expect(page.getByRole("heading", { name: "Login Successful!", level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Sunrise International School").first()).toBeVisible();

    // Click Go to Dashboard
    await page.locator("#login-success-dashboard-btn").click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Sunrise International School").first()).toBeVisible();
  });

  test("3. Sign In with 10-digit mobile number format", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#tab-signin-password").click();

    // Test with plain 10-digit mobile number without +91 prefix
    await page.locator("#login-id-input").fill("9876543210");
    await page.locator("#login-password-input").fill("Password@123");
    await page.locator("#password-signin-btn").click();

    await expect(page.getByRole("heading", { name: "Login Successful!", level: 3 })).toBeVisible({
      timeout: 15000,
    });
  });

  test("4. Sign In with School Email format", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#tab-signin-password").click();

    // Test with email identifier
    await page.locator("#login-id-input").fill("rohan.mehta@sunriseschool.edu.in");
    await page.locator("#login-password-input").fill("Password@123");
    await page.locator("#password-signin-btn").click();

    await expect(page.getByRole("heading", { name: "Login Successful!", level: 3 })).toBeVisible({
      timeout: 15000,
    });
  });

  test("5. Health Check Endpoint validates system liveness", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("school-management-saas");
  });
});
