// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ParentsManagementWorkspace } from "@/modules/parents/components/parents-management-workspace";
import {
  buildHouseholdClusters,
  computeParentAnalytics,
} from "@/modules/parents/analytics";
import type {
  GuardianRecord,
  GuardianStudentCandidate,
  ParentWorkspaceSnapshot,
} from "@/modules/parents/types";

const sampleStudents: GuardianStudentCandidate[] = [
  {
    id: "stu-101",
    admissionNumber: "ADM-101",
    studentName: "Aarav Test",
    currentGrade: "Class V",
    currentSection: "A",
    currentAcademicYear: "2026-2027",
    status: "ACTIVE",
    guardianName: "Suresh Test",
    guardianPhone: "9810001001",
    guardianEmail: "suresh@example.test",
    guardianRelation: "Father",
  },
  {
    id: "stu-102",
    admissionNumber: "ADM-102",
    studentName: "Diya Test",
    currentGrade: "Class II",
    currentSection: "B",
    currentAcademicYear: "2026-2027",
    status: "ACTIVE",
    guardianName: "Suresh Test",
    guardianPhone: "9810001001",
    guardianEmail: "suresh@example.test",
    guardianRelation: "Father",
  },
];

const sampleGuardians: GuardianRecord[] = [
  {
    id: "g-101",
    schoolId: "school-1",
    userId: null,
    fullName: "Suresh Test",
    phone: "9810001001",
    normalizedPhone: "9810001001",
    alternatePhone: null,
    email: "suresh@example.test",
    occupation: "Engineer",
    employer: "Tech Co",
    education: "B.Tech",
    preferredLanguage: "English",
    address: null,
    idProofType: "Aadhaar",
    idProofMasked: "XXXX-XXXX-9012",
    photoKey: null,
    phoneVerified: true,
    emailVerified: false,
    portalStatus: "ACTIVE",
    portalInvitedAt: null,
    status: "ACTIVE",
    communicationPrefs: {
      sms: true,
      email: true,
      whatsapp: true,
      inApp: true,
      feeReminders: true,
      attendanceAlerts: true,
      academicUpdates: true,
      mediaConsent: true,
    },
    notes: null,
    wards: [
      {
        linkId: "l-1",
        studentId: "stu-101",
        admissionNumber: "ADM-101",
        studentName: "Aarav Test",
        currentAcademicYear: "2026-2027",
        currentGrade: "Class V",
        currentSection: "A",
        studentStatus: "ACTIVE",
        relation: "Father",
        isPrimary: true,
        isEmergencyContact: true,
        canPickup: true,
        isFeePayer: true,
        receivesAcademicAlerts: true,
        receivesFeeAlerts: true,
        custodyNote: null,
        restrictedContact: false,
        isActive: true,
        linkedAt: "2026-04-01T00:00:00.000Z",
      },
      {
        linkId: "l-2",
        studentId: "stu-102",
        admissionNumber: "ADM-102",
        studentName: "Diya Test",
        currentAcademicYear: "2026-2027",
        currentGrade: "Class II",
        currentSection: "B",
        studentStatus: "ACTIVE",
        relation: "Father",
        isPrimary: true,
        isEmergencyContact: true,
        canPickup: true,
        isFeePayer: true,
        receivesAcademicAlerts: true,
        receivesFeeAlerts: true,
        custodyNote: null,
        restrictedContact: false,
        isActive: true,
        linkedAt: "2026-04-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
];

const mockSnapshot: ParentWorkspaceSnapshot = {
  schoolId: "school-1",
  schoolName: "Sunrise Test Academy",
  schoolSlug: "sunrise-test",
  guardians: sampleGuardians,
  students: sampleStudents,
  communications: [
    {
      id: "c-1",
      schoolId: "school-1",
      guardianId: "g-101",
      studentId: "stu-101",
      studentName: "Aarav Test",
      channel: "APP",
      direction: "OUTBOUND",
      senderName: "Principal",
      recipientName: "Suresh Test",
      subject: "PTM Schedule",
      body: "Annual PTM starts Friday 9 AM.",
      status: "SENT",
      createdAt: "2026-04-05T10:00:00.000Z",
    },
  ],
  grades: ["Class II", "Class V"],
  sections: ["A", "B"],
};

describe("ParentsManagementWorkspace UI & Light/Dark mode", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  it("renders KPIs, sibling badges, tabs, and supports switching to Guardian 360°", () => {
    const analytics = computeParentAnalytics(sampleGuardians, mockSnapshot.grades);
    const households = buildHouseholdClusters(sampleGuardians, sampleStudents);

    render(
      <ParentsManagementWorkspace
        mode="school"
        schoolId="school-1"
        initialSnapshot={mockSnapshot}
        initialAnalytics={analytics}
        initialHouseholds={households}
        permissions={{
          canWrite: true,
          canLink: true,
          canPortal: true,
          canCommunicate: true,
          canExport: true,
        }}
      />,
    );

    expect(screen.getByText("Parents & Guardians")).toBeInTheDocument();
    expect(screen.getByText("Suresh Test")).toBeInTheDocument();
    expect(screen.getByText("Aarav Test")).toBeInTheDocument();
    expect(screen.getByText("Diya Test")).toBeInTheDocument();

    // Switch to Households & Siblings tab
    fireEvent.click(screen.getByRole("button", { name: /Households & Siblings/i }));
    expect(screen.getByText("Detected Family Households & Sibling Clusters")).toBeInTheDocument();
    expect(screen.getByText("Suresh Test Household")).toBeInTheDocument();

    // Switch to Portal & Consents tab
    fireEvent.click(screen.getByRole("button", { name: /Portal Access & Consents/i }));
    expect(screen.getByText(/Parent Portal Onboarding/i)).toBeInTheDocument();

    // Switch to Communications tab
    fireEvent.click(screen.getByRole("button", { name: /Communications/i }));
    expect(screen.getByText(/Annual PTM starts Friday 9 AM/i)).toBeInTheDocument();

    // Return to directory and open Guardian 360° profile
    fireEvent.click(screen.getByRole("button", { name: /Guardian Directory/i }));
    fireEvent.click(screen.getByRole("button", { name: "Suresh Test" }));
    expect(screen.getByText("Multi-Child Household")).toBeInTheDocument();
    expect(screen.getByText(/Linked Wards \(2\)/i)).toBeInTheDocument();
  });

  it("supports dark mode classes without breaking modal dialogs", () => {
    document.documentElement.classList.add("dark");
    const analytics = computeParentAnalytics(sampleGuardians, mockSnapshot.grades);
    const households = buildHouseholdClusters(sampleGuardians, sampleStudents);

    const { container } = render(
      <ParentsManagementWorkspace
        mode="school"
        schoolId="school-1"
        initialSnapshot={mockSnapshot}
        initialAnalytics={analytics}
        initialHouseholds={households}
        permissions={{
          canWrite: true,
          canLink: true,
          canPortal: true,
          canCommunicate: true,
          canExport: true,
        }}
      />,
    );

    expect(container.innerHTML).toContain("dark:bg-[#141731]");
    fireEvent.click(screen.getByRole("button", { name: /Add Guardian/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add Parent / Guardian")).toBeInTheDocument();
  });
});
