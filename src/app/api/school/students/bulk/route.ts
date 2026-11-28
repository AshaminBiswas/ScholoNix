import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentService } from "@/server/school/student-service";
import { bulkStudentsActionSchema } from "@/modules/students/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = bulkStudentsActionSchema.parse(body);
    const result = await studentService.bulkUpdateStudents(resolved.ctx, parsed);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
