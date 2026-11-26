import type { Route } from "next";
import type { SchoolShellSchool, SchoolShellUser } from "@/modules/school/components/school-workspace-shell";

export function buildSchoolRoute(schoolSlug: string, subPath: string = ""): Route {
  const cleanSlug = encodeURIComponent(schoolSlug);
  const cleanSub = subPath.replace(/^\/+/, "");
  return (cleanSub ? `/${cleanSlug}/${cleanSub}` : `/${cleanSlug}`) as Route;
}

export function formatAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) return "SA";
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function formatRoleLabel(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function buildSchoolShellProps(
  school: {
    id: string;
    name: string;
    slug: string;
    uniqueId?: string | null;
    code?: string | null;
    affiliationBoard?: string | null;
  },
  user: {
    id: string;
    name: string;
    role: string;
    email?: string | null;
    phone?: string | null;
  },
): { school: SchoolShellSchool; user: SchoolShellUser } {
  const displayName = user.name?.trim() || "School Administrator";
  return {
    school: {
      id: school.id,
      name: school.name,
      slug: school.slug,
      uniqueId: school.uniqueId || null,
      code: school.code || "",
      affiliationBoard: school.affiliationBoard || "CBSE",
    },
    user: {
      id: user.id,
      name: displayName,
      displayRole: formatRoleLabel(user.role),
      avatarInitials: formatAvatarInitials(displayName),
      email: user.email || null,
      phone: user.phone || null,
    },
  };
}
