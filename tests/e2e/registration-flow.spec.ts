import { test, expect } from "@playwright/test";

test.describe("School Registration Page Visual & Workflow", () => {
  test("renders the complete Register Your School UI as designed", async ({ page }) => {
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.message));

    await page.goto("/register");

    // Header
    const header = page.locator("header").first();
    await expect(header).toContainText("School Management SaaS");
    await expect(header).toContainText("Features");
    await expect(header).toContainText("Pricing");
    await expect(header).toContainText("Sign In");

    // Left Column
    await expect(page.locator("h1")).toContainText("Register Your School");
    await expect(page.locator("body")).toContainText("Your own secure school workspace");
    await expect(page.locator("body")).toContainText("Multi-user access for your team");
    await expect(page.locator("body")).toContainText("Quick and easy setup");

    // Center Form - Step 1: Institution Details
    await expect(page.locator("body")).toContainText("Institution Details");
    await expect(page.locator("body")).toContainText("School / Institution Name");
    await expect(page.locator("body")).toContainText("School Type / Category");
    await expect(page.locator("body")).toContainText("Board / Affiliation");
    await expect(page.locator("body")).toContainText("Contact Phone (School)");
    await expect(page.locator("body")).toContainText("Registered Address");
    await expect(page.locator("body")).toContainText("School Logo (Optional)");

    // Right Column Cards
    await expect(page.locator("body")).toContainText("What Happens Next?");
    await expect(page.locator("body")).toContainText("Administrator Details");
    await expect(page.locator("body")).toContainText("Simple & Flexible Pricing");
    await expect(page.locator("body")).toContainText("₹1,999");
    await expect(page.locator("body")).toContainText("Student & Staff Management");
    await expect(page.locator("body")).toContainText("Your data is secure");

    // Stepper navigation test: Proceed to Step 2
    await page.waitForLoadState("networkidle");
    const continueBtn = page.locator("#continue-to-admin-btn");
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Verify URL parameter increased to ?step=2 and window scrolled to top
    await expect(page).toHaveURL(/step=2/);
    const scrollYAfterStep1 = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
    expect(scrollYAfterStep1).toBeLessThanOrEqual(50);

    // Verify Step 2: Administrator Details is displayed (matching the design)
    await expect(
      page.getByRole("heading", { name: "Administrator Details", level: 2 }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("label:has-text('Administrator Full Name')")).toBeVisible();
    await expect(page.locator("label:has-text('Designation / Role')")).toBeVisible();
    await expect(page.locator("label:has-text('Mobile Number')")).toBeVisible();
    await expect(page.locator("label:has-text('Email Address')")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Account Access" })).toBeVisible();
    await expect(page.locator("h3:has-text('Set a Password (Optional)')")).toBeVisible();
    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await expect(page.getByText("Include a letter and a number")).toBeVisible();
    await expect(page.getByText("Use a strong, unique password")).toBeVisible();

    const continueToVerifyBtn = page.locator("#continue-to-verify-mobile-btn");
    await expect(continueToVerifyBtn).toBeVisible();
    await expect(continueToVerifyBtn).toContainText("Continue to Verify Mobile");

    const backBtn = page.locator("#back-to-step1-btn");
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText("Back");
  });

  test("registration page mobile responsive check", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/register");

    const overflows = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const all = document.querySelectorAll("*");
      const bad = [];
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 1 || r.width > docWidth + 1) {
          bad.push({
            tag: el.tagName,
            cls: (el.className || "").toString().slice(0, 80),
            width: Math.round(r.width),
            right: Math.round(r.right),
            text: (el.textContent || "").slice(0, 30).trim(),
          });
        }
      }
      return {
        docWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bad: bad.slice(0, 15),
      };
    });

    console.log("MOBILE OVERFLOW REPORT:", JSON.stringify(overflows, null, 2));
    expect(overflows.scrollWidth <= overflows.docWidth).toBe(true);

    const saveBtn = page.getByRole("button", { name: "Save & Continue Later" });
    const continueBtn = page.locator("#continue-to-admin-btn");

    const saveBox = await saveBtn.boundingBox();
    const continueBox = await continueBtn.boundingBox();

    console.log("BUTTON BOXES AT 390px:", { saveBox, continueBox });
    // User requirement: "save & continue later" should be BELOW "continue to administrator"
    // continueBox.y is top row, saveBox.y is bottom row (saveBox.y > continueBox.y)
    expect(saveBox!.y).toBeGreaterThan(continueBox!.y);

    // Both buttons should expand to full width of form card
    expect(saveBox!.width).toBeGreaterThanOrEqual(300);
    expect(continueBox!.width).toBeGreaterThanOrEqual(300);
  });

  test("Step 2 Administrator Details renders accurately and supports navigation", async ({
    page,
  }) => {
    await page.goto("/register?step=2");

    // Stepper header should indicate Step 2 active
    await expect(
      page.getByRole("heading", { name: "Administrator Details", level: 2 }),
    ).toBeVisible();

    // Verify fields
    const nameInput = page.getByPlaceholder("e.g. Rohan Mehta");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue("Rohan Mehta");

    // Verify designation dropdown
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("Principal");

    // Verify mobile input prefix and number
    await expect(page.getByText("+91")).toBeVisible();
    const phoneInput = page.getByPlaceholder("98765 43210");
    await expect(phoneInput).toBeVisible();

    // Verify Account Access callout
    await expect(page.getByRole("heading", { name: "Account Access" })).toBeVisible();
    await expect(
      page.getByText("Use your verified mobile number to sign in"),
    ).toBeVisible();

    // Verify password checklist
    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await expect(page.getByText("Include a letter and a number")).toBeVisible();
    await expect(page.getByText("Use a strong, unique password")).toBeVisible();

    // Verify clicking Back returns to Step 1
    const backBtn = page.locator("#back-to-step1-btn");
    await backBtn.click();
    await expect(
      page.getByRole("heading", { name: "Institution Details", level: 2 }),
    ).toBeVisible();
  });

  test("Step 3 Verify & Confirm renders accurately and advances to Step 4", async ({
    page,
  }) => {
    await page.goto("/register?step=3");

    // Stepper header should indicate Step 3 active
    await expect(
      page.getByRole("heading", { name: "Verify & Confirm", level: 2 }),
    ).toBeVisible();

    // Verify Mobile Number card
    await expect(page.getByText("Verify Mobile Number")).toBeVisible();
    await expect(page.getByText("OTP Verified")).toBeVisible();
    await expect(page.getByText("Mobile number verified successfully.")).toBeVisible();
    await expect(page.getByText("Change Number")).toBeVisible();

    // Verify Email Address card
    await expect(page.getByText("Verify Email Address")).toBeVisible();
    const sendEmailOtpBtn = page.getByRole("button", {
      name: "Send Email OTP",
    });
    await expect(sendEmailOtpBtn).toBeVisible();
    await sendEmailOtpBtn.click();
    await expect(page.getByText("Email Verified")).toBeVisible();

    // Verify why verification is important box
    await expect(page.getByText("Why verification is important?")).toBeVisible();

    // Continue to Select Plan (Step 4)
    const continueBtn = page.locator("#continue-to-review-btn");
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Verify URL increased to ?step=4
    await expect(page).toHaveURL(/step=4/);

    // Verify step 4 Select Plan is displayed
    await expect(
      page.getByRole("heading", { name: "Select a Plan for Your School", level: 2 }),
    ).toBeVisible();
  });

  test("Step 4 Select Plan renders pricing cards, billing toggle and advances to Step 5", async ({
    page,
  }) => {
    await page.goto("/register?step=4");

    // Verify Header
    await expect(
      page.getByRole("heading", { name: "Select a Plan for Your School", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText("Choose the plan that best fits your school's size and needs"),
    ).toBeVisible();

    // Verify Toggle
    await expect(page.getByRole("button", { name: "Monthly" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Yearly/ })).toBeVisible();
    await expect(page.getByText("Save up to 20%")).toBeVisible();

    // Verify 3 Plan Cards
    await expect(page.getByRole("heading", { name: "Starter", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise", level: 3 })).toBeVisible();
    await expect(page.getByText("Most Popular")).toBeVisible();

    // Verify features
    await expect(page.getByText("Up to 500 students")).toBeVisible();
    await expect(page.getByText("Up to 2,000 students")).toBeVisible();
    await expect(page.getByText("Unlimited students")).toBeVisible();

    // Verify sidebars are removed on Step 4 per user requirement (distraction-free pricing page)
    await expect(page.getByRole("heading", { name: "Register Your School" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Why Choose Us?" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Plan Highlights" })).not.toBeVisible();

    // Verify Skip later options
    await expect(page.getByRole("button", { name: "Skip later →" })).toBeVisible();
    const skipBtn = page.locator("#skip-plan-btn");
    await expect(skipBtn).toBeVisible();
    await expect(skipBtn).toContainText("Skip for Now");

    // Advance to Step 5
    const continueBtn = page.locator("#continue-to-review-step4-btn");
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Verify URL increased to ?step=5
    await expect(page).toHaveURL(/step=5/);

    await expect(
      page.getByRole("heading", { name: "Review & Create", level: 2 }),
    ).toBeVisible();
  });

  test("Step 4 Skip for Now skips plan and shows Free Trial in Step 5", async ({
    page,
  }) => {
    await page.goto("/register?step=4");

    const skipBtn = page.locator("#skip-plan-btn");
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();

    // Should advance to Step 5
    await expect(
      page.getByRole("heading", { name: "Review & Create", level: 2 }),
    ).toBeVisible();

    // Selected plan card should reflect skipped trial
    await expect(page.getByText("14-Day Free Trial")).toBeVisible();
    await expect(page.getByText("Plan Selection Skipped")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose Plan" })).toBeVisible();
  });

  test("Step 5 Review & Create renders summaries and creates school account", async ({
    page,
  }) => {
    // Intercept registration API call to test UI submission and success state reliably
    await page.route("**/api/auth/register-school", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "School registered successfully",
          data: {
            schoolId: "sch_123456",
            schoolName: "Sunrise International School",
            slug: "sunrise-international-school",
            adminName: "Rohan Mehta",
          },
        }),
      });
    });

    await page.goto("/register?step=5");

    // Verify Header
    await expect(
      page.getByRole("heading", { name: "Review & Create", level: 2 }),
    ).toBeVisible();

    // Verify Section 1: Institution Details
    await expect(page.getByText("Sunrise International School")).toBeVisible();
    await expect(page.getByText("Co-Educational School")).toBeVisible();
    await expect(page.getByText("CBSE")).toBeVisible();

    // Verify Section 2: Administrator Details
    await expect(page.getByText("Rohan Mehta")).toBeVisible();
    await expect(page.getByText("Principal", { exact: true })).toBeVisible();

    // Verify Section 3: Selected Plan
    await expect(page.getByText("Selected Plan")).toBeVisible();
    await expect(page.getByText("Professional Plan")).toBeVisible();

    // Verify Section 4: Verification Status
    await expect(page.getByText("Verification Status")).toBeVisible();
    await expect(page.getByText("Mobile Verified")).toBeVisible();

    // Verify Section 5: Terms and Consent
    await expect(page.getByText("Terms and Consent")).toBeVisible();
    await expect(
      page.getByText("I agree to the Terms of Service and Privacy Policy."),
    ).toBeVisible();

    // Verify sidebars are removed on Step 5 per user requirement (distraction-free review page)
    await expect(page.getByRole("heading", { name: "Register Your School" })).not.toBeVisible();
    await expect(page.getByText("Registration Progress")).not.toBeVisible();
    await expect(page.getByText("What Happens After This?")).not.toBeVisible();

    // Submit and Create School Account
    const createBtn = page.locator("#final-create-school-btn");
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify success popup modal matching design mockup
    await expect(
      page.getByRole("heading", {
        name: "School Account Created Successfully!",
        level: 2,
      }),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByText(
        "Sunrise International School has been registered on School Management SaaS.",
      ),
    ).toBeVisible();

    // 3 Feature items in the popup
    await expect(
      page.getByText("School Account Created", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Onboarding Wizard Ready")).toBeVisible();
    await expect(page.getByText("Access Your School Web Panel")).toBeVisible();

    // Action button & links
    const startWizardBtn = page.locator("#start-onboarding-wizard-btn");
    await expect(startWizardBtn).toBeVisible();
    await expect(startWizardBtn).toContainText("Start Onboarding Wizard");

    const dashboardLink = page.getByRole("link", { name: "Go to Dashboard" });
    await expect(dashboardLink).toBeVisible();

    // Verify close button dismisses popup
    const closeBtn = page.getByRole("button", { name: "Close modal" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(
      page.getByRole("heading", {
        name: "School Account Created Successfully!",
      }),
    ).not.toBeVisible();
  });

  test("Direct URL opens Success Popup Modal accurately (?success=true)", async ({
    page,
  }) => {
    await page.goto("/register?success=true");

    await expect(
      page.getByRole("heading", {
        name: "School Account Created Successfully!",
        level: 2,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("School Account Created", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Onboarding Wizard Ready")).toBeVisible();
    await expect(page.getByText("Access Your School Web Panel")).toBeVisible();
    await expect(page.locator("#start-onboarding-wizard-btn")).toBeVisible();
  });

  test("supports selecting country code in registration step 1 and step 2", async ({ page }) => {
    await page.goto("/register?step=1");

    // Step 1: School Contact Phone country code
    const schoolCountryTrigger = page.locator("#register-school-country-code-select");
    await expect(schoolCountryTrigger).toBeVisible();
    await expect(schoolCountryTrigger).toContainText("+91");

    // Open and select United Arab Emirates (+971)
    await schoolCountryTrigger.click();
    const aeOption = page.locator("#register-school-country-code-select-opt-AE");
    await expect(aeOption).toBeVisible();
    await aeOption.click();
    await expect(schoolCountryTrigger).toContainText("+971");

    // Proceed to Step 2
    await page.locator("#continue-to-admin-btn").click();
    await expect(page).toHaveURL(/step=2/);

    // Step 2: Admin Mobile Number country code
    const adminCountryTrigger = page.locator("#register-admin-country-code-select");
    await expect(adminCountryTrigger).toBeVisible();
    await adminCountryTrigger.click();

    // Select United States (+1)
    const usOption = page.locator("#register-admin-country-code-select-opt-US");
    await expect(usOption).toBeVisible();
    await usOption.click();
    await expect(adminCountryTrigger).toContainText("+1");
  });
});
