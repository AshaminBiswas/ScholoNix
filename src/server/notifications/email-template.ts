export interface RenderOtpEmailOptions {
  code: string;
  purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET";
  recipientName?: string;
  expiresInMinutes?: number;
  appUrl?: string;
  logoUrl?: string;
}

/**
 * Generates an email template matching the attached ScholoNix visual design.
 * Features:
 * - Enforces light mode only across all email clients (disables dark mode inversion)
 * - Minimal outer padding and tight card layout for mobile screens
 * - Uses the official ScholoNix high-res logo image (CID / hosted URL compatible)
 * - 100% email client compatible: replaces stripped inline SVGs with standard images & unicode
 * - Prominent 6-digit verification code pill box
 * - Pill badge for expiration countdown
 * - Security advisory and safe-ignore alert banners
 * - Responsive footer with team signoff and unsubscribe pill
 */
export function renderOtpEmailHtml(options: RenderOtpEmailOptions): string {
  const {
    code,
    purpose,
    expiresInMinutes = 5,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    logoUrl: explicitLogoUrl,
  } = options;

  let title = "Verify Your Email Address";
  let subtitle = "Complete your registration and secure your ScholoNix account.";

  if (purpose === "LOGIN") {
    title = "Sign In to Your Account";
    subtitle = "Complete your sign in and securely access your ScholoNix dashboard.";
  } else if (purpose === "PASSWORD_RESET") {
    title = "Reset Your Password";
    subtitle = "Use this code to securely choose a new password for your ScholoNix account.";
  }

  const unsubscribeUrl = `${appUrl}/notifications/unsubscribe`;
  const year = new Date().getFullYear();

  // Use explicit logo URL, or env EMAIL_LOGO_URL, or hosted URL if HTTPS, or CID inline image for local/offline delivery
  const defaultLogo = appUrl.startsWith("https://")
    ? `${appUrl}/images/scholonix-logo.png`
    : "cid:scholonix-logo";
  const logoSrc = explicitLogoUrl || process.env.EMAIL_LOGO_URL || defaultLogo;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <!-- Enforce Light Mode Only across all mail clients -->
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <style type="text/css">
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      background-color: #ede9fe !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .email-container {
      max-width: 440px;
      margin: 0 auto;
      width: 100%;
    }
    .card-shadow {
      box-shadow: 0 8px 24px -4px rgba(99, 102, 241, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
    }
    /* Enforce Light Mode on Dark Mode Clients (Gmail, Apple Mail, Outlook) */
    @media (prefers-color-scheme: dark) {
      body, .email-bg-table {
        background-color: #ede9fe !important;
        background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 40%, #fae8ff 75%, #e0e7ff 100%) !important;
        color: #1f2937 !important;
      }
      .card-surface {
        background-color: #ffffff !important;
        color: #1f2937 !important;
      }
      .text-title {
        color: #1e1b4b !important;
      }
      .text-sub {
        color: #4b5563 !important;
      }
      .text-heading {
        color: #374151 !important;
      }
      .code-pill {
        background-color: #ede9fe !important;
        color: #1e1b4b !important;
      }
      .alert-pill {
        background-color: #f5f3ff !important;
        border-color: #ede9fe !important;
        color: #4b5563 !important;
      }
      .badge-time {
        background-color: #ddd6fe !important;
        color: #5b21b6 !important;
      }
      .footer-border {
        border-color: #f3f4f6 !important;
      }
      .footer-title {
        color: #312e81 !important;
      }
      .footer-sub {
        color: #6b7280 !important;
      }
      .unsub-pill {
        color: #4338ca !important;
        border-color: #4338ca !important;
      }
      .copyright-text {
        color: #1e1b4b !important;
      }
    }
    /* Outlook Dark Mode Targets */
    [data-ogsc] body, [data-ogsc] .email-bg-table {
      background-color: #ede9fe !important;
    }
    [data-ogsc] .card-surface {
      background-color: #ffffff !important;
    }
    [data-ogsc] .text-title {
      color: #1e1b4b !important;
    }
    [data-ogsc] .code-pill {
      background-color: #ede9fe !important;
      color: #1e1b4b !important;
    }
    @media only screen and (max-width: 480px) {
      .outer-padding {
        padding: 4px 2px 8px !important;
      }
      .card-surface {
        border-radius: 12px !important;
      }
      .card-padding {
        padding: 16px 12px 12px !important;
      }
      .brand-logo-img {
        width: 140px !important;
      }
      .text-title {
        font-size: 17px !important;
      }
      .text-sub {
        font-size: 12px !important;
      }
      .otp-code {
        font-size: 26px !important;
        letter-spacing: 5px !important;
      }
      .footer-table td {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
      .footer-btn-td {
        padding-top: 8px !important;
      }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #ede9fe; background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 40%, #fae8ff 75%, #e0e7ff 100%);">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-bg-table" style="background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 40%, #fae8ff 75%, #e0e7ff 100%); width: 100%;">
    <tr>
      <td align="center" valign="top" class="outer-padding" style="padding: 4px 4px 8px; vertical-align: top;">
        <table role="presentation" class="email-container" border="0" cellspacing="0" cellpadding="0" style="max-width: 440px; width: 100%; margin: 0 auto;">
          
          <!-- MAIN CARD -->
          <tr>
            <td class="card-surface card-shadow" style="background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(224, 231, 255, 0.85); overflow: hidden;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="card-padding" style="padding: 18px 16px 14px; text-align: center;">
                    
                    <!-- 1. BRAND LOGO (Official ScholoNix High-Res Logo Image) -->
                    <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 12px;">
                      <tr>
                        <td align="center">
                          <img
                            src="${logoSrc}"
                            alt="ScholoNix"
                            width="160"
                            class="brand-logo-img"
                            style="display: block; width: 160px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 800; color: #4338ca;"
                          />
                        </td>
                      </tr>
                    </table>

                    <!-- 2. TITLE & SUBTITLE -->
                    <h1 class="text-title" style="margin: 0 0 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.3px; line-height: 1.25;">
                      ${title}
                    </h1>
                    <p class="text-sub" style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #4b5563; line-height: 1.4; font-weight: 400;">
                      ${subtitle}
                    </p>

                    <!-- 3. CODE INTRODUCTION -->
                    <p class="text-heading" style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; color: #374151;">
                      Use the verification code below:
                    </p>

                    <!-- 4. 6-DIGIT CODE PILL BOX -->
                    <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px;">
                      <tr>
                        <td align="center" class="code-pill" style="background-color: #ede9fe; border-radius: 10px; padding: 10px 22px;">
                          <div class="otp-code" style="font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1e1b4b; padding-left: 6px; line-height: 1;">
                            ${code}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- 5. EXPIRATION TIMER BADGE -->
                    <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px;">
                      <tr>
                        <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #374151;">
                          <span style="vertical-align: middle;">This verification code expires in </span>
                          <span class="badge-time" style="display: inline-block; vertical-align: middle; background-color: #ddd6fe; color: #5b21b6; padding: 1px 8px; border-radius: 8px; font-weight: 700; font-size: 11px; margin-left: 2px;">
                            ${expiresInMinutes} minutes.
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- 6. SECURITY NOTICE ALERT PILL -->
                    <table role="presentation" align="center" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px; max-width: 410px;">
                      <tr>
                        <td class="alert-pill" style="background-color: #f5f3ff; border: 1px solid #ede9fe; border-radius: 8px; padding: 7px 12px; text-align: left;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #4b5563; line-height: 1.35;">
                            If you didn't create a ScholoNix account, you can safely ignore this email.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- 7. SECURITY ADVISORY CHECKLIST -->
                    <table role="presentation" align="center" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px; max-width: 410px;">
                      <tr>
                        <td style="text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #374151; line-height: 1.45;">
                          <div style="font-weight: 700; color: #111827; margin-bottom: 2px;">For your security:</div>
                          <div style="margin: 1px 0;">
                            <span style="font-weight: bold; margin-right: 4px; color: #111827;">&#10003;</span> Never share this verification code with anyone.
                          </div>
                          <div style="margin: 1px 0;">
                            <span style="font-weight: bold; margin-right: 4px; color: #111827;">&#10003;</span> ScholoNix will never ask you to disclose your code.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- 8. INNER FOOTER (Team Signoff & Unsubscribe Pill) -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="footer-table footer-border" style="border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 4px;">
                      <tr>
                        <td align="left" style="vertical-align: middle;">
                          <div class="footer-title" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 800; color: #312e81;">
                            The ScholoNix Team
                          </div>
                          <div class="footer-sub" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #6b7280; margin-top: 1px;">
                            One Platform. Every School Solution.
                          </div>
                        </td>
                        <td align="right" class="footer-btn-td" style="vertical-align: middle;">
                          <a href="${unsubscribeUrl}" target="_blank" class="unsub-pill" style="display: inline-block; padding: 3px 12px; border: 1px solid #4338ca; border-radius: 9999px; color: #4338ca; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; text-decoration: none;">
                            Unsubscribe
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 9. OUTER BOTTOM COPYRIGHT -->
          <tr>
            <td align="center" style="padding: 6px 0 8px; text-align: center;">
              <div class="copyright-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #1e1b4b; opacity: 0.85;">
                &copy; ${year} ScholoNix. All Rights Reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
