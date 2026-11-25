import "server-only";
import { AuthorizationError } from "@/lib/errors";

export type Role =
  | "PLATFORM_SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "PRINCIPAL"
  | "TEACHER"
  | "ACCOUNTANT"
  | "STAFF"
  | "STUDENT"
  | "GUARDIAN"
  | "PARENT";

export type Permission =
  | "schools:manage"
  | "users:read"
  | "users:write"
  | "students:read"
  | "students:write"
  | "admissions:read"
  | "admissions:write"
  | "admissions:verify"
  | "admissions:export"
  | "admissions:settings"
  | "attendance:read"
  | "attendance:write"
  | "fees:read"
  | "fees:write"
  | "exams:read"
  | "exams:write"
  | "reports:view"
  | "audit:view";

const ADMIN_PERMISSIONS: readonly Permission[] = [
  "users:read",
  "users:write",
  "students:read",
  "students:write",
  "admissions:read",
  "admissions:write",
  "admissions:verify",
  "admissions:export",
  "admissions:settings",
  "attendance:read",
  "attendance:write",
  "fees:read",
  "fees:write",
  "exams:read",
  "exams:write",
  "reports:view",
  "audit:view",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  PLATFORM_SUPER_ADMIN: ["schools:manage", ...ADMIN_PERMISSIONS],
  SCHOOL_ADMIN: ADMIN_PERMISSIONS,
  PRINCIPAL: ADMIN_PERMISSIONS,
  TEACHER: [
    "students:read",
    "attendance:read",
    "attendance:write",
    "exams:read",
    "exams:write",
    "reports:view",
  ],
  ACCOUNTANT: ["students:read", "fees:read", "fees:write", "reports:view"],
  STAFF: [
    "students:read",
    "admissions:read",
    "admissions:write",
    "admissions:verify",
    "attendance:read",
    "fees:read",
    "fees:write",
    "reports:view",
  ],
  STUDENT: ["attendance:read", "exams:read", "fees:read"],
  GUARDIAN: ["attendance:read", "exams:read", "fees:read"],
  PARENT: ["attendance:read", "exams:read", "fees:read"],
};

export interface AuthUser {
  id: string;
  role: Role | string;
  schoolId?: string | null;
  isSuperAdmin?: boolean;
}

/**
 * Checks whether an authenticated user has the specified permission.
 */
export function hasPermission(user: AuthUser, permission: Permission): boolean {
  if (user.isSuperAdmin || user.role === "PLATFORM_SUPER_ADMIN") {
    return true;
  }
  const permissions = ROLE_PERMISSIONS[user.role as Role] ?? [];
  return permissions.includes(permission);
}

/**
 * Asserts that the authenticated user possesses the required permission.
 * Throws AuthorizationError if permission is denied.
 */
export function authorize(user: AuthUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError(`Action requires '${permission}' permission.`);
  }
}
