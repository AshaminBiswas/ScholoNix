import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentDossierService } from "@/server/school/student-dossier-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;
    const { studentId } = await context.params;

    const dossier = await studentDossierService.getDossier(resolved.ctx, studentId);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const s = dossier.student;

    let y = 795;
    const drawLine = (text: string, size = 10, isBold = false) => {
      page.drawText(text, {
        x: 48,
        y,
        size,
        font: isBold ? bold : regular,
        color: rgb(0.05, 0.06, 0.23),
      });
      y -= size + 7;
    };

    drawLine(`${resolved.ctx.schoolName} — Student Profile 360° Dossier`, 16, true);
    drawLine(`Admission No: ${s.admissionNumber}   Status: ${s.status}`, 11, true);
    y -= 6;
    drawLine(`Student Name: ${s.studentName}`, 12, true);
    drawLine(`Class & Section: ${s.currentGrade} - ${s.currentSection}   Roll No: ${s.currentRollNumber || "-"}`, 10);
    drawLine(`Academic Year: ${s.currentAcademicYear}   Admission Date: ${s.admissionDate.slice(0, 10)}`, 10);
    drawLine(`Gender / DOB / Blood Group: ${s.gender || "-"} | ${s.dateOfBirth || "-"} | ${s.bloodGroup || "-"}`, 10);
    y -= 8;
    drawLine("Guardian & Contact Details", 12, true);
    drawLine(`Primary Guardian: ${s.guardianName} (${s.guardianRelation})`, 10);
    drawLine(`Guardian Phone: ${s.guardianPhone}   Email: ${s.guardianEmail || "-"}`, 10);
    y -= 8;
    drawLine("Fee Summary (INR)", 12, true);
    drawLine(
      `Total: Rs.${(dossier.feeSummary.totalFeePaise / 100).toLocaleString("en-IN")} | Paid: Rs.${(
        dossier.feeSummary.paidPaise / 100
      ).toLocaleString("en-IN")} | Outstanding: Rs.${(
        dossier.feeSummary.outstandingPaise / 100
      ).toLocaleString("en-IN")}`,
      10,
    );
    y -= 8;
    drawLine(`Enrollments (${s.enrollments.length}) & Transfers (${s.transfers.length})`, 12, true);
    for (const enr of s.enrollments.slice(0, 8)) {
      drawLine(`• AY ${enr.academicYear}: ${enr.grade} - ${enr.section} (${enr.status})`, 9.5);
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${s.admissionNumber}-profile-360.pdf"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
