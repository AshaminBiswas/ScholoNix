import { test, expect } from "@playwright/test";

test.describe("Forgot Password & Password Reset Workflow", () => {
  test("login page links to forgot password page", async ({ page }) => {
    await page.goto("/login");
    // Switch to password tab where Forgot Password? link is located
    const passwordTab = page.locator("#tab-signin-password");
    await passwordTab.click();
    const forgotLink = page.getByRole("link", { name: "Forgot Password?" });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("full forgot password flow from Step 1 to Step 4", async ({ page }) => {
    await page.goto("/forgot-password");

    // ----------------------------------------------------
    // STEP 1: Forgot Password Request (Phone & Email tabs)
    // ----------------------------------------------------
    await expect(page.getByRole("heading", { name: "Forgot Password?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Forgot Password", exact: true })).toBeVisible();
    await expect(page.getByText("Secure Password Reset")).toBeVisible();
    await expect(page.getByText("Quick and Easy")).toBeVisible();
    await expect(page.getByText("Keep Your Account Safe")).toBeVisible();

    // Toggle between Phone and Email
    const emailTab = page.getByRole("button", { name: "Email Address" });
    const mobileTab = page.getByRole("button", { name: "Mobile Number" });
    await expect(mobileTab).toBeVisible();
    await expect(emailTab).toBeVisible();

    // Switch to Email
    await emailTab.click();
    await expect(page.getByPlaceholder("principal@sunriseis.edu.in")).toBeVisible();

    // Switch back to Mobile
    await mobileTab.click();
    await expect(page.getByPlaceholder("98765 43210")).toBeVisible();

    // Submit Step 1: Send OTP
    const sendOtpBtn = page.getByRole("button", { name: "Send OTP" });
    await expect(sendOtpBtn).toBeVisible();
    await sendOtpBtn.click();

    // ----------------------------------------------------
    // STEP 2: Verify OTP
    // ----------------------------------------------------
    await expect(page.getByRole("heading", { name: "Verify Your Account" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verify OTP" })).toBeVisible();
    await expect(page.getByText("Secure Verification")).toBeVisible();

    // Check 6 OTP boxes
    const otpDigit1 = page.getByLabel("Digit 1");
    await expect(otpDigit1).toBeVisible();
    const otpDigit6 = page.getByLabel("Digit 6");
    await expect(otpDigit6).toBeVisible();

    // Check change method link
    const changeMethodBtn = page.getByRole("button", { name: "Change Verification Method" });
    await expect(changeMethodBtn).toBeVisible();

    // Click Verify to advance to Step 3
    const verifyBtn = page.getByRole("button", { name: "Verify" });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // ----------------------------------------------------
    // STEP 3: Create New Password
    // ----------------------------------------------------
    await expect(page.getByRole("heading", { name: "Create New Password" }).first()).toBeVisible();
    await expect(page.getByText("Secure Account")).toBeVisible();
    await expect(page.getByText("Keep Your Data Safe")).toBeVisible();

    // Verify checklist items
    await expect(page.getByText("Password must contain:")).toBeVisible();
    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await expect(page.getByText("At least one uppercase letter (A-Z)")).toBeVisible();
    await expect(page.getByText("At least one lowercase letter (a-z)")).toBeVisible();
    await expect(page.getByText("At least one number (0-9)")).toBeVisible();
    await expect(page.getByText("At least one special character")).toBeVisible();

    // Submit Step 3: Create New Password
    const createPwBtn = page.getByRole("button", { name: "Create New Password" });
    await expect(createPwBtn).toBeVisible();
    await createPwBtn.click();

    // ----------------------------------------------------
    // STEP 4: Password Changed Successfully!
    // ----------------------------------------------------
    await expect(page.getByRole("heading", { name: "Password Reset Successful!" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Password Changed Successfully!" })).toBeVisible();
    await expect(page.getByText("Your account password has been updated")).toBeVisible();

    // Primary CTA: Go to Login
    const loginLink = page.getByRole("link", { name: "Go to Login" });
    await expect(loginLink).toBeVisible();

    // Secondary CTA: Go to Home
    const homeLink = page.getByRole("link", { name: "Go to Home" });
    await expect(homeLink).toBeVisible();
  });

  test("step navigation via direct URL query parameters", async ({ page }) => {
    // Jump directly to Step 3
    await page.goto("/forgot-password?step=3");
    await expect(page.getByRole("heading", { name: "Create New Password" }).first()).toBeVisible();

    // Jump directly to Step 4
    await page.goto("/forgot-password?step=4");
    await expect(page.getByRole("heading", { name: "Password Changed Successfully!" })).toBeVisible();
  });

  test("mobile viewport has zero horizontal overflow and responsive stacking", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/forgot-password?step=1");
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBeFalsy();

    // Card is visible on mobile
    await expect(page.getByRole("heading", { name: "Forgot Password", exact: true })).toBeVisible();
  });
});
