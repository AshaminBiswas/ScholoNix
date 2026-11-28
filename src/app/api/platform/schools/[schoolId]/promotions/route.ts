import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import {
  executePromotionBatchSchema,
  promotionFilterQuerySchema,
  upsertPromotionRulesSchema,
} from "@/modules/students/promotion-schemas";

export const dynamic = "force-dynamic";

function buildPlatformActor(
  auth: {
    session: { user: { id: string; name?: string | null; role: string } };
    ipAddress?: string;
    userAgent?: string;
  },
  schoolId: string,
) {
  return {
    userId: auth.session.user.id,
    userName: `${auth.session.user.name || "Platform Admin"} (Platform Admin)`,
    role: auth.session.user.role,
    schoolId,
    ipAddress: auth.ipAddress,
    userAgent: auth.userAgent,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "promotions:school:overview");
    if (!auth.authorized) return auth.response;

    const { schoolId } = await context.params;
    const url = new URL(req.url);
    const parsed = promotionFilterQuerySchema.parse({
      academicYear: url.searchParams.get("academicYear") || undefined,
      fromGrade: url.searchParams.get("fromGrade") || undefined,
      toGrade: url.searchParams.get("toGrade") || undefined,
      section: url.searchParams.get("section") || undefined,
      status: url.searchParams.get("status") || undefined,
      search: url.searchParams.get("search") || undefined,
    });

    const overview = await studentPromotionService.getOverview(
      buildPlatformActor(auth, schoolId),
      {
        academicYear: parsed.academicYear,
        fromGrade: parsed.fromGrade,
        toGrade: parsed.toGrade,
        section: parsed.section,
        status: parsed.status,
        search: parsed.search,
      },
    );

    return NextResponse.json({ success: true, overview });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "promotions:school:execute");
    if (!auth.authorized) return auth.response;

    const { schoolId } = await context.params;
    const body = await req.json();
    const parsed = executePromotionBatchSchema.parse(body);
    const result = await studentPromotionService.executeBatch(
      buildPlatformActor(auth, schoolId),
      parsed,
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "promotions:school:rules");
    if (!auth.authorized) return auth.response;

    const { schoolId } = await context.params;
    const body = await req.json();
    const parsed = upsertPromotionRulesSchema.parse(body);
    const result = await studentPromotionService.saveRulesAndSettings(
      buildPlatformActor(auth, schoolId),
      parsed,
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
