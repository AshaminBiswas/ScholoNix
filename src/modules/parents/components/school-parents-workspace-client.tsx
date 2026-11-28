"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SchoolWorkspaceShell,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "@/modules/school/components/school-workspace-shell";
import type {
  HouseholdCluster,
  ParentDashboardAnalytics,
  ParentNavSection,
  ParentWorkspaceSnapshot,
} from "@/modules/parents/types";
import { ParentsManagementWorkspace } from "./parents-management-workspace";

export function SchoolParentsWorkspaceClient({
  school,
  user,
  initialSnapshot,
  initialAnalytics,
  initialHouseholds,
  initialSection,
  initialGuardianId = null,
  permissions,
}: {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  initialSnapshot: ParentWorkspaceSnapshot;
  initialAnalytics: ParentDashboardAnalytics;
  initialHouseholds: HouseholdCluster[];
  initialSection: ParentNavSection;
  initialGuardianId?: string | null;
  permissions: {
    canWrite: boolean;
    canLink: boolean;
    canPortal: boolean;
    canCommunicate: boolean;
    canExport: boolean;
  };
}) {
  const router = useRouter();

  return (
    <SchoolWorkspaceShell
      school={school}
      user={user}
      activeNav="parents"
      activeParentSection={initialSection}
    >
      <ParentsManagementWorkspace
        mode="school"
        schoolId={school.id}
        initialSnapshot={initialSnapshot}
        initialAnalytics={initialAnalytics}
        initialHouseholds={initialHouseholds}
        initialSection={initialSection}
        initialGuardianId={initialGuardianId}
        permissions={permissions}
        onNavigateSection={(sec, gId) => {
          const base = `/${encodeURIComponent(school.slug)}/parents`;
          if (sec === "profile" && gId) {
            router.push(`${base}/${encodeURIComponent(gId)}`);
          } else if (sec === "directory") {
            router.push(base);
          } else {
            router.push(`${base}/${sec}`);
          }
        }}
      />
    </SchoolWorkspaceShell>
  );
}
