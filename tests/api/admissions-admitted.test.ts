import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as directAdmitPost } from "@/app/api/school/admissions/admitted/route";
import { POST as importAdmittedPost } from "@/app/api/school/admissions/admitted/import/route";
import { PATCH as enrollmentPatch } from "@/app/api/school/admissions/admitted/[applicationId]/route";
import { POST as feeLedgerPost } from "@/app/api/school/admissions/admitted/fees/ledger/route";
import { POST as feePaymentPost } from "@/app/api/school/admissions/admitted/fees/payments/route";
import { GET as admittedExportGet } from "@/app/api/school/admissions/admitted/export/route";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

async function seedSchoolAdmin(tag: string) {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`.toLowerCase();
  const passwordHash = await hashPassword(`Adm!${randomBytes(8).toString("hex")}7`);
  const { school, user } = await authRepository.createUserWithSchool({
    school: {
      name: `Admitted School ${tag} ${unique}`,
      slug: `sc_${randomBytes(10).toString("hex")}`,
      code: `AD-${randomBytes(2).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302001",
      country: "India",
    },
    user: {
      name: `Principal ${tag}`,
      email: `admitted.${unique}@scholonix.example`,
      phone: `+9195${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role: "PRINCIPAL",
      phoneVerified: true,
      emailVerified: true,
    },
  });
  const session = await sessionService.createSession(user);
  const cookieHeader = `${getSessionCookieName()}=${session.token}`;
  return { school, user, cookieHeader };
}

describe("Admitted Students Workbench API & Financial Integrity", () => {
  it("supports direct admit, CSV import, enrollment status update, minor-unit fee ledger, idempotent payments, overpayment rejection, CSV export, and tenant isolation", async () => {
    const schoolA = await seedSchoolAdmin("alpha");
    const schoolB = await seedSchoolAdmin("beta");

    // 1. Direct Admit Student with Initial Fee Assessment
    const admitRes = await directAdmitPost(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            studentName: "Aarav Synthetic Admitted",
            gender: "Male",
            dateOfBirth: "2019-06-14",
            gradeApplied: "Class I",
            academicYear: "2026-27",
            guardianName: "Rajesh Synthetic Guardian",
            guardianPhone: "+919876543210",
            admissionType: "RE_ADMISSION",
            totalFeeRupees: 50000,
          }),
        },
      ),
    );
    expect(admitRes.status).toBe(201);
    const stu = (await admitRes.json()).student;
    expect(stu.status).toBe("ADMITTED");
    expect(stu.admissionNumber).toMatch(/^ADM2026-/);
    expect(stu.admissionType).toBe("RE_ADMISSION");
    expect(stu.enrollmentStatus).toBe("ACTIVE");

    // 2. Bulk Import Admitted Students
    const importRes = await importAdmittedPost(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/import?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            students: [
              {
                studentName: "Diya Synthetic Transfer",
                gradeApplied: "Class IV",
                academicYear: "2026-27",
                guardianName: "Priya Synthetic",
                guardianPhone: "+919876500011",
                admissionType: "TRANSFER",
              },
            ],
          }),
        },
      ),
    );
    expect(importRes.status).toBe(201);
    const importJson = await importRes.json();
    expect(importJson.count).toBe(1);

    // 3. Apply Fee Concession (Total 50,000, Concession 5,000 => Net 45,000 => 4,500,000 paise)
    const ledgerRes = await feeLedgerPost(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/fees/ledger?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            applicationId: stu.id,
            totalFeeRupees: 50000,
            concessionRupees: 5000,
            concessionReason: "Merit scholarship",
          }),
        },
      ),
    );
    expect(ledgerRes.status).toBe(200);
    const ledgerJson = await ledgerRes.json();
    expect(ledgerJson.ledger.totalFeePaise).toBe(5_000_000);
    expect(ledgerJson.ledger.concessionPaise).toBe(500_000);
    expect(ledgerJson.ledger.outstandingPaise).toBe(4_500_000);

    // 4. Record Partial Fee Payment (Rs 20,000) + Idempotency Check
    const idempKey = "idemp-pay-0001";
    const payRes1 = await feePaymentPost(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/fees/payments?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            applicationId: stu.id,
            idempotencyKey: idempKey,
            feeHead: "Admission Fee",
            amountRupees: 20000,
            paymentMode: "UPI",
            referenceNo: "UPI123456789",
          }),
        },
      ),
    );
    expect(payRes1.status).toBe(201);
    const payJson1 = await payRes1.json();
    expect(payJson1.payment.receiptNumber).toMatch(/^RCP2026-/);
    expect(payJson1.ledger.paidPaise).toBe(2_000_000);
    expect(payJson1.ledger.outstandingPaise).toBe(2_500_000);
    expect(payJson1.ledger.paymentStatus).toBe("PARTIAL");

    // Duplicate retry with SAME idempotency key must NOT double-credit
    const payResDup = await feePaymentPost(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/fees/payments?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            applicationId: stu.id,
            idempotencyKey: idempKey,
            feeHead: "Admission Fee",
            amountRupees: 20000,
            paymentMode: "UPI",
          }),
        },
      ),
    );
    expect(payResDup.status).toBe(201);
    const payJsonDup = await payResDup.json();
    expect(payJsonDup.payment.receiptNumber).toBe(payJson1.payment.receiptNumber);
    expect(payJsonDup.ledger.paidPaise).toBe(2_000_000);

    // 5. Reject Overpayment exceeding remaining 25,000 balance
    const overpayRes = await feePaymentPost(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/fees/payments?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            applicationId: stu.id,
            idempotencyKey: "idemp-pay-overpay",
            feeHead: "Tuition Fee",
            amountRupees: 30000,
            paymentMode: "Cash",
          }),
        },
      ),
    );
    expect(overpayRes.status).toBe(400);

    // 6. Update Enrollment Status (TRANSFERRED) & Reject Cross-Tenant Access
    const statusRes = await enrollmentPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/${stu.id}?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({ enrollmentStatus: "TRANSFERRED" }),
        },
      ),
      { params: Promise.resolve({ applicationId: stu.id }) },
    );
    expect(statusRes.status).toBe(200);
    expect((await statusRes.json()).student.enrollmentStatus).toBe("TRANSFERRED");

    const crossRes = await enrollmentPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/${stu.id}?schoolSlug=${schoolB.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolB.cookieHeader,
          },
          body: JSON.stringify({ enrollmentStatus: "WITHDRAWN" }),
        },
      ),
      { params: Promise.resolve({ applicationId: stu.id }) },
    );
    expect(crossRes.status).toBe(404);

    // 7. Export Fee Ledger CSV
    const exportFees = await admittedExportGet(
      new NextRequest(
        `http://localhost/api/school/admissions/admitted/export?dataset=fees&schoolSlug=${schoolA.school.slug}&academicYear=2026-27`,
        { headers: { cookie: schoolA.cookieHeader } },
      ),
    );
    expect(exportFees.status).toBe(200);
    const csv = await exportFees.text();
    expect(csv).toContain("Aarav Synthetic Admitted");
    expect(csv).toContain("20000.00");
    expect(csv).toContain("PARTIAL");
  });
});
