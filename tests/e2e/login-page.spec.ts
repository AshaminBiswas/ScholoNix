import { test, expect } from "@playwright/test";

test.describe("School Login Page Visual & Interactive Features", () => {
  test("renders all key branding, school illustration, and OTP sign-in form matching design", async ({
    page,
  }) => {
    await page.goto("/login");

    // 1. Header
    const header = page.locator("#login-header");
    await expect(header).toContainText("School Management SaaS");
    await expect(header.getByRole("link", { name: "Register Your School →" })).toBeVisible();

    // 2. Left Column Hero & Branding
    await expect(page.getByRole("heading", { name: "School Login", level: 1 })).toBeVisible();
    await expect(
      page.getByText("Sign in to your school's workspace and manage students, staff, academics, fees and more."),
    ).toBeVisible();

    // 3 Operational Pillars
    await expect(page.getByText("Manage").first()).toBeVisible();
    await expect(page.getByText("Students & Staff").first()).toBeVisible();
    await expect(page.getByText("Run").first()).toBeVisible();
    await expect(page.getByText("Academics").first()).toBeVisible();
    await expect(page.getByText("Track").first()).toBeVisible();
    await expect(page.getByText("Fees & Reports").first()).toBeVisible();

    // 3. Right Card - Sign In to Your School (OTP mode by default)
    await expect(page.getByRole("heading", { name: "Sign In to Your School", level: 2 })).toBeVisible();
    await expect(
      page.getByText("Access your school's independent workspace on the platform."),
    ).toBeVisible();

    // Top Switcher Tabs: Mobile, Email, Password
    await expect(page.locator("#tab-signin-otp")).toBeVisible();
    await expect(page.locator("#tab-signin-otp")).toContainText("Mobile");
    await expect(page.locator("#tab-signin-email")).toBeVisible();
    await expect(page.locator("#tab-signin-email")).toContainText("Email");
    await expect(page.locator("#tab-signin-password")).toBeVisible();
    await expect(page.locator("#tab-signin-password")).toContainText("Password");

    // Mobile number input with flag & prefix (no prefilled credentials)
    await expect(page.getByText("+91")).toBeVisible();
    const phoneInput = page.locator("#login-otp-phone-input");
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveValue("");

    // Inline email switch link
    await expect(page.locator("#otp-mode-use-email-link")).toBeVisible();

    // Helper callout
    await expect(
      page.getByText("We'll send a one-time password (OTP) to verify your number."),
    ).toBeVisible();

    // Primary action: Send OTP
    const sendOtpBtn = page.locator("#send-otp-btn");
    await expect(sendOtpBtn).toBeVisible();
    await expect(sendOtpBtn).toContainText("Send OTP");

    // Redundant secondary action buttons have been removed
    await expect(page.locator("#switch-to-email-btn")).not.toBeVisible();
    await expect(page.locator("#switch-to-password-btn")).not.toBeVisible();

    // Register link & Security card
    await expect(page.locator("main").getByRole("link", { name: "Register Your School →" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your data is secure" })).toBeVisible();
  });

  test("supports login with Email Address via Email OTP flow", async ({ page }) => {
    const testEmail = `e2e.login.${Date.now()}@scholonix.example`;
    await page.route("**/api/auth/otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { cooldownSeconds: 60 },
        }),
      });
    });
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { name: "Synthetic Admin", email: testEmail, role: "SCHOOL_ADMIN" },
            school: { name: "Synthetic Test Academy", slug: "synthetic-test-academy" },
          },
        }),
      });
    });

    await page.goto("/login");

    // Switch to Email OTP tab (starts empty without prefilled credentials)
    await page.locator("#tab-signin-email").click();
    const emailInput = page.locator("#login-email-input");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue("");
    await emailInput.fill(testEmail);

    // Helper callout for email
    await expect(
      page.getByText("We'll send a 6-digit verification code (OTP) to your email address."),
    ).toBeVisible();

    // Send Email OTP
    const sendEmailOtpBtn = page.locator("#send-email-otp-btn");
    await expect(sendEmailOtpBtn).toBeVisible();
    await sendEmailOtpBtn.click();

    // Verify OTP Verification view for Email
    await expect(page.getByRole("heading", { name: "OTP Verification", level: 2 })).toBeVisible();
    await expect(page.getByText(`We've sent a 6-digit OTP to ${testEmail}.`)).toBeVisible();

    // Change email button
    const changeEmailBtn = page.locator("#change-mobile-btn");
    await expect(changeEmailBtn).toBeVisible();
    await expect(changeEmailBtn).toContainText("Change Email Address");

    // Enter OTP digits and Verify & Sign In
    for (let i = 0; i < 6; i++) {
      await page.locator(`#otp-box-${i}`).fill(String(i + 1));
    }
    await page.locator("#verify-and-signin-btn").click();
    await expect(page.getByRole("heading", { name: "Login Successful!", level: 3 })).toBeVisible();
  });

  test("switches between Sign in with OTP, Email Address, and Password seamlessly", async ({ page }) => {
    await page.goto("/login");

    // Click Password tab
    await page.locator("#tab-signin-password").click();

    // Should now show tab switcher with Password active
    await expect(page.locator("#tab-signin-otp")).toBeVisible();
    await expect(page.locator("#tab-signin-email")).toBeVisible();
    await expect(page.locator("#tab-signin-password")).toBeVisible();

    // Form inputs for Password mode (start empty without prefilled credentials)
    const idInput = page.locator("#login-id-input");
    await expect(idInput).toBeVisible();
    await expect(idInput).toHaveValue("");

    const passwordInput = page.locator("#login-password-input");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Toggle password visibility
    const toggleEye = page.getByLabel("Toggle password visibility");
    await toggleEye.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await toggleEye.click();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Forgot password link
    await expect(page.getByRole("button", { name: "Forgot Password?" })).toBeVisible();

    // Primary Sign In button
    const signinBtn = page.locator("#password-signin-btn");
    await expect(signinBtn).toBeVisible();
    await expect(signinBtn).toContainText("Sign In");

    // Switch to Email OTP tab
    await page.locator("#tab-signin-email").click();
    await expect(page.locator("#send-email-otp-btn")).toBeVisible();

    // Switch back to Mobile OTP tab
    await page.locator("#tab-signin-otp").click();
    await expect(page.locator("#send-otp-btn")).toBeVisible();
  });

  test("sends OTP and navigates to OTP Verification state with 6 digit boxes and countdown", async ({
    page,
  }) => {
    const testDigits = "90000 12345";
    await page.route("**/api/auth/otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { cooldownSeconds: 60 },
        }),
      });
    });

    await page.goto("/login");

    // Enter synthetic mobile digits and click Send OTP
    await page.locator("#login-otp-phone-input").fill(testDigits);
    await page.locator("#send-otp-btn").click();

    // Verify OTP Verification view
    await expect(page.getByRole("heading", { name: "OTP Verification", level: 2 })).toBeVisible();
    await expect(page.getByText(`We've sent a 6-digit OTP to +91 ${testDigits}.`)).toBeVisible();

    // 6 OTP boxes
    for (let i = 0; i < 6; i++) {
      await expect(page.locator(`#otp-box-${i}`)).toBeVisible();
    }

    // Verify change number button returns to OTP input
    const changeNumberBtn = page.locator("#change-mobile-btn");
    await expect(changeNumberBtn).toBeVisible();
    await changeNumberBtn.click();
    await expect(page.locator("#send-otp-btn")).toBeVisible();

    // Go back to OTP verification
    await page.locator("#send-otp-btn").click();
    await expect(page.getByRole("heading", { name: "OTP Verification", level: 2 })).toBeVisible();
  });

  test("successful verification opens Login Successful popup modal matching mockup", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { name: "Synthetic Admin", role: "SCHOOL_ADMIN" },
            school: { name: "Synthetic Test Academy", slug: "synthetic-test-academy" },
          },
        }),
      });
    });

    await page.goto("/login?mode=verify");

    // Fill 6-digit OTP and submit verification
    for (let i = 0; i < 6; i++) {
      await page.locator(`#otp-box-${i}`).fill("1");
    }
    const verifyBtn = page.locator("#verify-and-signin-btn");
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // Login Successful modal dialog
    await expect(page.getByRole("heading", { name: "Login Successful!", level: 3 })).toBeVisible();
    await expect(page.getByText("Welcome back, Synthetic Admin!")).toBeVisible();
    await expect(page.getByText("You have been signed in to Synthetic Test Academy.")).toBeVisible();

    // 3 Quick-access modules
    await expect(page.getByText("Go to Dashboard").first()).toBeVisible();
    await expect(page.getByText("Manage Academics")).toBeVisible();
    await expect(page.getByText("Manage Students & Staff").first()).toBeVisible();

    // Primary action
    const dashboardBtn = page.locator("#login-success-dashboard-btn");
    await expect(dashboardBtn).toBeVisible();
    await expect(dashboardBtn).toContainText("Go to Dashboard");

    // "Continue to School Web Panel" link removed per user request
    await expect(page.getByRole("link", { name: "Continue to School Web Panel" })).not.toBeVisible();

    // Close button dismisses modal
    await page.locator("#close-login-success-modal").click();
    await expect(page.getByRole("heading", { name: "Login Successful!" })).not.toBeVisible();
  });

  test("direct URL with ?success=true opens Login Successful modal immediately", async ({ page }) => {
    await page.goto("/login?success=true");
    await expect(page.getByRole("heading", { name: "Login Successful!", level: 3 })).toBeVisible();
  });

  test("login page is fully responsive on mobile viewports (390px)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    // Ensure zero horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify main card is visible and takes full width cleanly
    await expect(page.getByRole("heading", { name: "Sign In to Your School" })).toBeVisible();
    await expect(page.locator("#send-otp-btn")).toBeVisible();
  });

  test("allows selecting different country codes on login page (e.g. US +1)", async ({ page }) => {
    await page.goto("/login");

    const countrySelectTrigger = page.locator("#login-country-code-select");
    await expect(countrySelectTrigger).toBeVisible();
    await expect(countrySelectTrigger).toContainText("+91");

    // Click to open dropdown
    await countrySelectTrigger.click();

    // Verify popover opened
    const popover = page.getByRole("listbox", { name: "Select Country Code" });
    await expect(popover).toBeVisible();

    // Select US (+1)
    const usOption = page.locator("#login-country-code-select-opt-US");
    await expect(usOption).toBeVisible();
    await usOption.click();

    // Popover closes, trigger now shows +1
    await expect(popover).not.toBeVisible();
    await expect(countrySelectTrigger).toContainText("+1");
  });

  test("places the login form above the school illustration on small mobile devices (390px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    // Find the login card and the left hero/illustration column
    const loginCard = page.locator("h2:has-text('Sign In to Your School')");
    const schoolIllustration = page.locator("svg").first();

    await expect(loginCard).toBeVisible();
    await expect(schoolIllustration).toBeVisible();

    const loginCardBox = await loginCard.boundingBox();
    const illustrationBox = await schoolIllustration.boundingBox();

    expect(loginCardBox).not.toBeNull();
    expect(illustrationBox).not.toBeNull();
    // On small devices, login form is positioned above the school illustration
    expect(loginCardBox!.y).toBeLessThan(illustrationBox!.y);
  });

  test("navbar is sticky and remains at the top of the viewport when scrolling", async ({ page }) => {
    await page.goto("/login");

    const header = page.locator("#login-header");
    await expect(header).toBeVisible();

    // Scroll down 400px
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(100);

    // The sticky header's top bounding rect must remain pinned at top = 0
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox!.y).toBe(0);
  });
});
