// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import { StudentManagementWorkspace } from "@/modules/students/components/student-management-workspace";
import { computeStudentAnalytics } from "@/modules/students/analytics";
import type { StudentWorkspaceSnapshot } from "@/modules/students/types";

const sampleSnapshot: StudentWorkspaceSnapshot = {
  schoolId: "school-1",
  schoolName: "Sunrise International School",
  schoolSlug: "sunrise-international",
  academicYears: ["2025 – 2026", "2026 – 2027"],
  grades: ["Nursery", "Class I", "Class II", "Class VI"],
  sections: ["A", "B", "C"],
  pendingAdmittedCount: 0,
  settings: {
    schoolId: "school-1",
    defaultSections: ["A", "B", "C"],
    sectionsByGrade: {},
    rollNumberMode: "AUTO_ALPHA",
    requireTcOnTransfer: true,
    idCardConfig: {
      showBloodGroup: true,
      showGuardianPhone: true,
      showEmergencyContact: true,
      motto: "Excellence in Learning",
    },
    promotionConfig: {
      finalGradeForAlumni: "Class XII",
      autoAssignRollNumbers: true,
    },
  },
  groups: [
    {
      id: "grp-1",
      schoolId: "school-1",
      name: "Emerald House",
      category: "HOUSE",
      colorToken: "violet",
      description: "Primary house",
      memberStudentIds: ["stu-1"],
    },
  ],
  activities: [
    {
      id: "act-1",
      schoolId: "school-1",
      studentId: "stu-1",
      actorName: "Principal",
      actionType: "ENROLLED",
      summary: "Aarav Sharma added to Class I - A.",
      createdAt: "2026-01-20T10:00:00.000Z",
    },
  ],
  students: [
    {
      id: "stu-1",
      schoolId: "school-1",
      applicationId: null,
      admissionNumber: "ADM2025-0192",
      studentIdNumber: "STU-192",
      studentName: "Aarav Sharma",
      gender: "Male",
      dateOfBirth: "2018-05-11",
      bloodGroup: "O+",
      nationality: "Indian",
      photoKey: null,
      email: "aarav@example.test",
      phone: null,
      address: { city: "Jaipur", state: "Rajasthan" },
      guardianName: "Rajesh Sharma",
      guardianRelation: "Father",
      guardianPhone: "9876543210",
      guardianEmail: "rajesh@example.test",
      guardianDetails: null,
      previousSchool: null,
      academicDetails: null,
      medicalNotes: null,
      admissionType: "NEW_ADMISSION",
      admissionDate: "2026-01-20T00:00:00.000Z",
      status: "ACTIVE",
      currentAcademicYear: "2025 – 2026",
      currentGrade: "Class I",
      currentSection: "A",
      currentRollNumber: "1",
      graduationYear: null,
      inactiveReason: null,
      groupIds: ["grp-1"],
      enrollments: [
        {
          id: "enr-1",
          schoolId: "school-1",
          studentId: "stu-1",
          academicYear: "2025 – 2026",
          grade: "Class I",
          section: "A",
          rollNumber: "1",
          status: "ENROLLED",
          isCurrent: true,
          promotedFromEnrollmentId: null,
          remarks: null,
          effectiveFrom: "2025-04-01T00:00:00.000Z",
          effectiveTo: null,
        },
      ],
      transfers: [],
      feeSummary: {
        totalFeePaise: 500000,
        paidPaise: 400000,
        outstandingPaise: 100000,
      },
      createdAt: "2026-01-20T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
    {
      id: "stu-2",
      schoolId: "school-1",
      applicationId: null,
      admissionNumber: "ADM2025-0191",
      studentIdNumber: "STU-191",
      studentName: "Diya Verma",
      gender: "Female",
      dateOfBirth: "2014-08-22",
      bloodGroup: "B+",
      nationality: "Indian",
      photoKey: null,
      email: null,
      phone: null,
      address: null,
      guardianName: "Anita Verma",
      guardianRelation: "Mother",
      guardianPhone: "9811112233",
      guardianEmail: null,
      guardianDetails: null,
      previousSchool: null,
      academicDetails: null,
      medicalNotes: null,
      admissionType: "NEW_ADMISSION",
      admissionDate: "2026-01-19T00:00:00.000Z",
      status: "INACTIVE",
      currentAcademicYear: "2025 – 2026",
      currentGrade: "Class VI",
      currentSection: "B",
      currentRollNumber: "2",
      graduationYear: null,
      inactiveReason: "Long leave",
      groupIds: [],
      enrollments: [],
      transfers: [],
      feeSummary: null,
      createdAt: "2026-01-19T00:00:00.000Z",
      updatedAt: "2026-01-19T00:00:00.000Z",
    },
  ],
};

describe("StudentManagementWorkspace UI & Dark Mode parity", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders Student Dashboard KPIs, charts, Key Insights, Recent Students, and Student Profile dossier", () => {
    const analytics = computeStudentAnalytics(
      sampleSnapshot.students,
      {},
      sampleSnapshot.grades,
    );

    const { container } = render(
      <StudentManagementWorkspace
        mode="school"
        schoolId="school-1"
        initialSnapshot={sampleSnapshot}
        initialAnalytics={analytics}
        initialSection="dashboard"
        permissions={{
          canCreate: true,
          canEdit: true,
          canPromote: true,
          canTransfer: true,
          canExport: true,
          canManageSettings: true,
        }}
      />,
    );

    // Dashboard layout & Light/Dark mode tokens
    expect(screen.getByRole("heading", { name: /Student Dashboard/i })).toBeTruthy();
    expect(screen.getByText(/Student Enrolment Trend/i)).toBeTruthy();
    expect(screen.getByText(/Students by Status/i)).toBeTruthy();
    expect(screen.getByText(/Students by Grade/i)).toBeTruthy();
    expect(screen.getByText(/Gender Distribution/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Key Insights/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Important Actions/i })).toBeTruthy();
    expect(container.innerHTML).toContain("dark:bg-[#141731]");

    // Switch to Student List tab
    fireEvent.click(screen.getByRole("button", { name: /^Student List$/i }));
    expect(screen.getByRole("button", { name: /Bulk Actions/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Student Groups/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^ID Cards$/i })).toBeTruthy();
    expect(screen.getByText(/Recent Student Activities/i)).toBeTruthy();

    // Open Aarav Sharma Profile 360 dossier
    fireEvent.click(screen.getByRole("button", { name: /View Aarav Sharma/i }));
    expect(screen.getByText(/Parent \/ Guardian Information/i)).toBeTruthy();
    expect(screen.getByText(/Emerald House/i)).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Academic/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Attendance/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Fees/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Documents/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Communication/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Activities/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /History/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Academic/i }));
    expect(screen.getByText(/Academic Overview/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Fees/i }));
    expect(screen.getByText(/Fee Structure/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Documents/i }));
    expect(screen.getByText(/Document Compliance/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /History/i }));
    expect(screen.getByText(/Promotion & Class History/i)).toBeTruthy();

    // Clicking Back to List returns to Student List, and clicking any student name opens their profile
    fireEvent.click(screen.getByRole("button", { name: /Back to List/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Diya Verma$/i }));
    expect(screen.getByRole("heading", { name: /^Diya Verma$/i })).toBeTruthy();
  });
});
