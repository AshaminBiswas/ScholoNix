import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { RateLimitExceededError, ValidationError, toErrorResponse } from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { platformPasskeyChallengeSchema } from "@/modules/platform/schemas";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";
import {
  resolveWebAuthnContext,
  signWebAuthnChallenge,
} from "@/server/platform/platform-mfa-crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkRateLimit(`platform-passkey-chal:${ipAddress}`, 20, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError("Too many passkey challenge requests. Please wait.");
    }

    const body = await req.json();
    const parsed = platformPasskeyChallengeSchema.parse(body);
    const { primaryRpId } = resolveWebAuthnContext(req);
    const challenge = randomBytes(32).toString("base64url");
    const sessionCtx = await platformAdminAuthService.getSessionFromRequest(req);

    if (parsed.purpose === "register") {
      if (!sessionCtx) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
          { status: 401 },
        );
      }
      if (sessionCtx.admin.mustChangePassword) {
        throw new ValidationError("Change your initial password before registering a passkey.");
      }

      const excludeCredentials = await platformAdminAuthService.listPasskeyDescriptors({
        adminId: sessionCtx.admin.id,
      });
      const challengeToken = await signWebAuthnChallenge({
        challenge,
        adminId: sessionCtx.admin.id,
        purpose: "register",
      });

      return NextResponse.json({
        success: true,
        challenge,
        challengeToken,
        rp: { name: "ScholoNix Company Admin", id: primaryRpId },
        user: {
          id: Buffer.from(sessionCtx.admin.id).toString("base64url"),
          name: sessionCtx.admin.email,
          displayName: sessionCtx.admin.name,
        },
        excludeCredentials,
      });
    }

    const allowCredentials = await platformAdminAuthService.listPasskeyDescriptors({
      adminId: sessionCtx?.admin.id,
      email: parsed.email || undefined,
    });
    const challengeToken = await signWebAuthnChallenge({
      challenge,
      adminId: sessionCtx?.admin.id,
      purpose: "authenticate",
    });

    return NextResponse.json({
      success: true,
      challenge,
      challengeToken,
      rpId: primaryRpId,
      allowCredentials,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
