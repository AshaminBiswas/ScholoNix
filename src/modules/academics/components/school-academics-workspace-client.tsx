"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SchoolWorkspaceShell,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "@/modules/school/components/school-workspace-shell";
import type {
  AcademicNavSection,
  AcademicWorkspaceSnapshot,
} from "@/modules/academics/types";
import { AcademicsManagementWorkspace } from "./academics-management-workspace";

export function SchoolAcademicsWorkspaceClient({
  school,
  user,
  initialSnapshot,
  initialSection,
  permissions,
}: {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  initialSnapshot: AcademicWorkspaceSnapshot;
  initialSection: AcademicNavSection;
  permissions: {
    canWrite: boolean;
    canManageSettings: boolean;
  };
}) {
  const router = useRouter();

  return (
    <SchoolWorkspaceShell
      school={school}
      user={user}
      activeNav="academics"
      activeAcademicSection={initialSection}
    >
      <AcademicsManagementWorkspace
        initialSnapshot={initialSnapshot}
        initialSection={initialSection}
        permissions={permissions}
        onNavigateSection={(sec) => {
          const base = `/${encodeURIComponent(school.slug)}/academics`;
          if (sec === "explorer") {
            router.push(base);
          } else {
            router.push(`${base}/${sec}`);
          }
        }}
      />
    </SchoolWorkspaceShell>
  );
}
