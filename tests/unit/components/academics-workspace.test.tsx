// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AcademicsManagementWorkspace } from "@/modules/academics/components/academics-management-workspace";
import type { AcademicWorkspaceSnapshot } from "@/modules/academics/types";

const mockAcademicSnapshot: AcademicWorkspaceSnapshot = {
  schoolId: "school-1",
  schoolName: "Sunrise Test Academy",
  schoolSlug: "sunrise-test",
  activeAcademicYear: "2026-2027",
  sessions: [
    {
      id: "sess-1",
      schoolId: "school-1",
      name: "2026-2027",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      isCurrent: true,
      status: "ACTIVE",
      createdAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  subjects: [
    {
      id: "sub-1",
      schoolId: "school-1",
      code: "ENG",
      name: "English",
      category: "CORE",
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      status: "ACTIVE",
    },
    {
      id: "sub-2",
      schoolId: "school-1",
      code: "MATH",
      name: "Mathematics",
      category: "CORE",
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      status: "ACTIVE",
    },
  ],
  classes: [
    {
      id: "cls-5",
      schoolId: "school-1",
      academicYear: "2026-2027",
      name: "Class V",
      code: "CLSV",
      department: "Middle",
      displayOrder: 1,
      status: "ACTIVE",
      subjects: [
        {
          id: "csa-1",
          schoolId: "school-1",
          classId: "cls-5",
          subjectId: "sub-1",
          subjectCode: "ENG",
          subjectName: "English",
          subjectCategory: "CORE",
          academicYear: "2026-2027",
          teacherName: "Priya Nair",
          weeklyPeriods: 5,
          maxMarks: 100,
          passMarks: 33,
          isCompulsory: true,
          isActive: true,
        },
      ],
      sections: [
        {
          id: "sec-5a",
          schoolId: "school-1",
          classId: "cls-5",
          academicYear: "2026-2027",
          name: "A",
          capacity: 40,
          roomNumber: "204",
          classTeacherName: "Ravi Kumar",
          status: "ACTIVE",
          students: [
            {
              id: "stu-1",
              admissionNumber: "ADM-101",
              studentName: "Kabir Demo",
              rollNumber: "1",
              gender: "Male",
              status: "ACTIVE",
              grade: "Class V",
              section: "A",
              academicYear: "2026-2027",
              guardians: [
                {
                  id: "g-1",
                  fullName: "Vikram Demo",
                  relation: "Father",
                  phone: "+91 9810001001",
                  email: "vikram@example.test",
                  isPrimary: true,
                  canPickup: true,
                  isFeePayer: true,
                  restrictedContact: false,
                  portalStatus: "ACTIVE",
                  siblingNames: ["Ananya Demo (Class II)"],
                },
              ],
            },
          ],
        },
      ],
      studentCount: 1,
      guardianCount: 1,
    },
  ],
  kpis: {
    totalClasses: 1,
    totalSections: 1,
    totalSubjects: 2,
    totalStudents: 1,
    totalLinkedGuardians: 1,
  },
};

describe("AcademicsManagementWorkspace Tree Explorer & Light/Dark mode", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
  });

  it("renders full 4-column Class -> Subjects & Sections -> Students -> Parents drill-down", () => {
    render(
      <AcademicsManagementWorkspace
        initialSnapshot={mockAcademicSnapshot}
        permissions={{ canWrite: true, canManageSettings: true }}
      />,
    );

    expect(screen.getByText("1. All Classes")).toBeInTheDocument();
    expect(screen.getByText("2a. Subjects (1)")).toBeInTheDocument();
    expect(screen.getByText("2b. Sections (1)")).toBeInTheDocument();
    expect(screen.getByText(/3\. Students \(Class V - A\)/i)).toBeInTheDocument();
    expect(screen.getByText("4. Parents & Guardians")).toBeInTheDocument();

    expect(screen.getAllByText("Kabir Demo").length).toBeGreaterThan(0);
    expect(screen.getByText("Vikram Demo")).toBeInTheDocument();
    expect(screen.getByText(/Siblings: Ananya Demo \(Class II\)/i)).toBeInTheDocument();

    // Switch across tabs
    fireEvent.click(screen.getByRole("button", { name: "Classes & Subjects" }));
    expect(screen.getByText("Subject Catalog")).toBeInTheDocument();
    const classSelect = screen.getByLabelText("Select class for subject") as HTMLSelectElement;
    expect(classSelect).toBeInTheDocument();
    expect(Array.from(classSelect.options).map((o) => o.text)).toContain("Class V");

    fireEvent.click(screen.getByRole("button", { name: "Sections & Teachers" }));
    expect(screen.getByText(/Sections & Class Teachers/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Academic Years" }));
    expect(screen.getByText(/Academic Years & Sessions/i)).toBeInTheDocument();
  });

  it("supports dark mode classes across cards and controls", () => {
    document.documentElement.classList.add("dark");
    const { container } = render(
      <AcademicsManagementWorkspace
        initialSnapshot={mockAcademicSnapshot}
        permissions={{ canWrite: true, canManageSettings: true }}
      />,
    );
    expect(container.innerHTML).toContain("dark:bg-[#141731]");
  });
});
