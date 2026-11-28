import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse, ValidationError } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { studentService } from "@/server/school/student-service";
import { parseStudentFiltersFromUrl } from "@/modules/students/analytics";
import {
  bulkStudentsActionSchema,
  createStudentGroupSchema,
  createStudentSchema,
  importStudentsSchema,
  promoteStudentsSchema,
  transferStudentSchema,
  updateStudentSchema,
  updateStudentSettingsSchema,
} from "@/modules/students/schemas";

export const dynamic = "force-dynamic";

function buildPlatformActor(
  auth: Extract<Awaited<ReturnType<typeof requirePlatformSuperAdmin>>, { authorized: true }>,
  schoolId: string,
) {
  return {
    userId: auth.session.user.id,
    userName: `${auth.session.user.name} (Platform Admin)`,
    role: auth.session.user.role,
    schoolId,
    schoolSlug: schoolId,
    schoolName: "Platform Governance",
    ipAddress: auth.ipAddress,
    userAgent: auth.userAgent,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:students:read`);
    if (!auth.authorized) return auth.response;

    const filters = parseStudentFiltersFromUrl(new URL(req.url));
    const data = await studentService.getDashboardData(buildPlatformActor(auth, schoolId), filters);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:students:write`);
    if (!auth.authorized) return auth.response;

    const actor = buildPlatformActor(auth, schoolId);
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action || "CREATE_STUDENT").toUpperCase();

    if (action === "CREATE_STUDENT") {
      const student = await studentService.createStudent(actor, createStudentSchema.parse(body));
      return NextResponse.json({ success: true, student }, { status: 201 });
    }
    if (action === "PROMOTE") {
      const res = await studentService.promoteStudents(actor, promoteStudentsSchema.parse(body));
      return NextResponse.json({ success: true, ...res });
    }
    if (action === "TRANSFER") {
      const transfer = await studentService.transferStudent(actor, transferStudentSchema.parse(body));
      return NextResponse.json({ success: true, transfer });
    }
    if (
      action === "BULK" ||
      action === "SET_STATUS" ||
      action === "ASSIGN_SECTION" ||
      action === "ADD_TO_GROUP" ||
      action === "REMOVE_FROM_GROUP"
    ) {
      const bulkPayload =
        action === "BULK"
          ? { ...body, action: body.bulkAction ?? body.actionType }
          : body;
      const res = await studentService.bulkUpdateStudents(
        actor,
        bulkStudentsActionSchema.parse(bulkPayload),
      );
      return NextResponse.json({ success: true, ...res });
    }
    if (action === "CREATE_GROUP") {
      const group = await studentService.createGroup(actor, createStudentGroupSchema.parse(body));
      return NextResponse.json({ success: true, group }, { status: 201 });
    }
    if (action === "IMPORT") {
      const parsed = importStudentsSchema.parse(body);
      const res = await studentService.importStudents(actor, parsed.rows);
      return NextResponse.json({ success: true, ...res }, { status: 201 });
    }

    throw new ValidationError(`Unsupported student platform action "${action}".`);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:students:patch`);
    if (!auth.authorized) return auth.response;

    const actor = buildPlatformActor(auth, schoolId);
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action || "UPDATE_STUDENT").toUpperCase();

    if (action === "UPDATE_SETTINGS") {
      const settings = await studentService.updateSettings(
        actor,
        updateStudentSettingsSchema.parse(body),
      );
      return NextResponse.json({ success: true, settings });
    }

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
      throw new ValidationError("studentId is required.");
    }
    const student = await studentService.updateStudent(
      actor,
      studentId,
      updateStudentSchema.parse(body),
    );
    return NextResponse.json({ success: true, student });
  } catch (error) {
    return toErrorResponse(error);
  }
}
