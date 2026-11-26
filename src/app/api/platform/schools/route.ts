import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { authRepository } from "@/server/auth/auth-repository";
import { logAuditEvent } from "@/server/security/audit-logger";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await sessionService.getSessionFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Authentication required." },
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "PLATFORM_SUPER_ADMIN") {
      await logAuditEvent({
        schoolId: session.user.schoolId || "system",
        actorId: session.user.id,
        action: "PLATFORM_ADMIN_ACCESS_DENIED",
        entityType: "PlatformAdmin",
        entityId: "schools",
        details: { role: session.user.role },
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden: Company platform super-admin access required.",
          },
        },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const uniqueIdParam = url.searchParams.get("uniqueId")?.trim() || "";
    const queryParam = url.searchParams.get("q")?.trim() || "";
    const searchQuery = uniqueIdParam || queryParam;

    const results = await authRepository.searchSchoolsForAdmin(searchQuery);

    await logAuditEvent({
      schoolId: "platform",
      actorId: session.user.id,
      action: "PLATFORM_ADMIN_SCHOOL_SEARCH",
      entityType: "School",
      entityId: searchQuery || "*",
      details: { query: searchQuery || "*", resultsCount: results.length },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      schools: results.map((entry) => ({
        school: {
          id: entry.school.id,
          name: entry.school.name,
          slug: entry.school.slug,
          uniqueId: entry.school.uniqueId ?? null,
          code: entry.school.code,
          category: entry.school.category ?? null,
          affiliationBoard: entry.school.affiliationBoard ?? null,
          contactPhone: entry.school.contactPhone ?? null,
          contactEmail: entry.school.contactEmail ?? null,
          website: entry.school.website ?? null,
          addressLine: entry.school.addressLine ?? null,
          city: entry.school.city ?? null,
          state: entry.school.state ?? null,
          pinCode: entry.school.pinCode ?? null,
          country: entry.school.country,
          status: entry.school.status,
          plan: entry.school.plan ?? null,
          createdAt: entry.school.createdAt,
        },
        users: entry.users,
        counts: entry.counts,
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
