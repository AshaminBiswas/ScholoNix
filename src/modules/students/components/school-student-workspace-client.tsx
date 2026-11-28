"use client";

import React from "react";
import { StudentManagementWorkspace } from "@/modules/students/components/student-management-workspace";
import type {
  StudentDashboardAnalytics,
  StudentNavSection,
  StudentWorkspaceSnapshot,
} from "@/modules/students/types";

const SECTION_PATH_MAP: Record<StudentNavSection, string> = {
  dashboard: "",
  list: "/list",
  profile: "/profile",
  enrolment: "/enrolment",
  promotion: "/promotion",
  transfer: "/transfer",
  inactive: "/inactive",
  alumni: "/alumni",
  settings: "/settings",
};

export function SchoolStudentWorkspaceClient({
  schoolId,
  schoolSlug,
  initialSnapshot,
  initialAnalytics,
  initialSection,
  initialStudentId,
  permissions,
}: {
  schoolId: string;
  schoolSlug: string;
  initialSnapshot: StudentWorkspaceSnapshot;
  initialAnalytics: StudentDashboardAnalytics;
  initialSection: StudentNavSection;
  initialStudentId?: string | null;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canPromote: boolean;
    canTransfer: boolean;
    canExport: boolean;
    canManageSettings: boolean;
  };
}) {
  return (
    <StudentManagementWorkspace
      mode="school"
      schoolId={schoolId}
      initialSnapshot={initialSnapshot}
      initialAnalytics={initialAnalytics}
      initialSection={initialSection}
      initialStudentId={initialStudentId ?? null}
      permissions={permissions}
      sectionHrefBuilder={(section, studentId) => {
        if (section === "profile" && studentId) {
          return `/${schoolSlug}/students/profile/${encodeURIComponent(studentId)}`;
        }
        return `/${schoolSlug}/students${SECTION_PATH_MAP[section]}`;
      }}
      onSelectedStudentUrlChange={(section, studentId) => {
        if (typeof window === "undefined") return;
        const target =
          section === "profile" && studentId
            ? `/${schoolSlug}/students/profile/${encodeURIComponent(studentId)}`
            : `/${schoolSlug}/students${SECTION_PATH_MAP[section]}`;
        if (window.location.pathname !== target) {
          window.history.pushState(null, "", target);
        }
      }}
    />
  );
}
