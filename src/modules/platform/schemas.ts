import { z } from "zod";
import { updateAdmissionsSettingsSchema } from "@/modules/school/admissions/schemas";

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .optional()
  .nullable()
  .or(z.literal(""));

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(z.literal(""));

export const platformModuleFlagsSchema = z.object({
  admissions: z.boolean().default(true),
  enquiries: z.boolean().default(true),
  admittedStudents: z.boolean().default(true),
  feeLedgers: z.boolean().default(true),
  customFields: z.boolean().default(true),
  crmIntegration: z.boolean().default(true),
  reportsExport: z.boolean().default(true),
  smsAlerts: z.boolean().default(true),
});

export const provisionSchoolSchema = z.object({
  name: z.string().trim().min(3, "School name is required").max(255),
  code: z.string().trim().min(2, "School code is required").max(50).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(100).default("Co-Educational School"),
  affiliationBoard: z.string().trim().max(100).default("CBSE"),
  contactPhone: z.string().trim().min(7, "Contact phone is required").max(20),
  contactEmail: optionalEmailSchema,
  website: z.string().trim().max(255).optional().or(z.literal("")),
  addressLine: z.string().trim().max(255).default(""),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pinCode: z.string().trim().max(20).default(""),
  country: z.string().trim().max(100).default("India"),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "INACTIVE"]).default("ACTIVE"),
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("STARTER"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  trialDays: z.coerce.number().int().min(0).max(365).default(14),
  adminName: z.string().trim().min(2, "Primary admin name is required").max(120),
  adminEmail: z.string().trim().email("Valid primary admin email is required"),
  adminPhone: z.string().trim().min(7, "Primary admin phone is required").max(20),
  adminPassword: z
    .string()
    .min(8, "Initial password must be at least 8 characters")
    .max(128),
  adminRole: z.enum(["SCHOOL_ADMIN", "PRINCIPAL"]).default("PRINCIPAL"),
});

export const updatePlatformSchoolSchema = z.object({
  name: z.string().trim().min(3).max(255).optional(),
  code: z.string().trim().max(50).optional().nullable(),
  category: z.string().trim().max(100).optional(),
  affiliationBoard: z.string().trim().max(100).optional().nullable(),
  contactPhone: z.string().trim().min(7).max(20).optional(),
  contactEmail: optionalEmailSchema,
  website: z.string().trim().max(255).optional().nullable(),
  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pinCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  subscriptionStatus: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]).optional(),
  maxStudentsLimit: z.coerce.number().int().min(10).max(1_000_000).optional(),
  maxStaffLimit: z.coerce.number().int().min(1).max(100_000).optional(),
  enabledModules: platformModuleFlagsSchema.optional(),
  suspendedReason: z.string().trim().max(1000).optional().nullable(),
  internalNotes: z.string().trim().max(2000).optional().nullable(),
  trialEndsAt: optionalDateSchema,
  onboardingDone: z.boolean().optional(),
});

export const createPlatformSchoolUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: optionalEmailSchema,
  phone: z.string().trim().min(7, "Phone is required").max(20),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z
    .enum([
      "SCHOOL_ADMIN",
      "PRINCIPAL",
      "TEACHER",
      "ACCOUNTANT",
      "STAFF",
      "PARENT",
      "STUDENT",
    ])
    .default("STAFF"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  emailVerified: z.boolean().default(true),
  phoneVerified: z.boolean().default(true),
});

export const updatePlatformSchoolUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z
    .enum([
      "SCHOOL_ADMIN",
      "PRINCIPAL",
      "TEACHER",
      "ACCOUNTANT",
      "STAFF",
      "PARENT",
      "STUDENT",
    ])
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING_VERIFICATION", "SUSPENDED"]).optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  revokeSessions: z.boolean().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const platformSchoolDataPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_admission_settings"),
    settings: updateAdmissionsSettingsSchema,
  }),
  z.object({
    action: z.literal("update_application_status"),
    applicationId: z.string().uuid("Invalid application ID"),
    status: z.enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED", "ADMITTED", "REJECTED"]),
  }),
  z.object({
    action: z.literal("update_enquiry_status"),
    enquiryId: z.string().uuid("Invalid enquiry ID"),
    status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"]),
  }),
]);

export const createPlatformInvoiceSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  idempotencyKey: z.string().trim().min(8).max(80),
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  amountRupees: z.coerce.number().min(0).max(100_000_000),
  periodStart: z.string().trim().min(8),
  periodEnd: z.string().trim().min(8),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "VOID"]).default("PENDING"),
  paymentMode: z.string().trim().max(40).optional().or(z.literal("")),
  paymentReference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updatePlatformInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "VOID"]),
  paymentMode: z.string().trim().max(40).optional().or(z.literal("")),
  paymentReference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateSupportTicketSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  resolutionNotes: z.string().trim().max(2000).optional().nullable(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(200),
  message: z.string().trim().min(5, "Message is required").max(2000),
  severity: z.enum(["INFO", "WARNING", "MAINTENANCE"]).default("INFO"),
  targetPlan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional().nullable(),
  targetSchoolId: z.string().uuid().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  endsAt: optionalDateSchema,
});

export const updateAnnouncementSchema = z.object({
  announcementId: z.string().uuid("Invalid announcement ID"),
  isActive: z.boolean().optional(),
  title: z.string().trim().min(3).max(200).optional(),
  message: z.string().trim().min(5).max(2000).optional(),
  severity: z.enum(["INFO", "WARNING", "MAINTENANCE"]).optional(),
});

export const platformAdminLoginSchema = z.object({
  email: z.string().trim().email("Valid company admin email is required"),
  password: z.string().min(1, "Password is required").max(128),
});

export const createPlatformAdminSchema = z.object({
  name: z.string().trim().min(2, "Admin name is required").max(120),
  email: z.string().trim().email("Valid company email is required"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(10, "Password must be at least 10 characters").max(128),
  role: z
    .enum(["SUPER_ADMIN", "OPERATIONS", "BILLING_MANAGER", "SUPPORT_AGENT"])
    .default("OPERATIONS"),
  department: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updatePlatformAdminSchema = z.object({
  adminId: z.string().uuid("Invalid platform admin ID"),
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z
    .enum(["SUPER_ADMIN", "OPERATIONS", "BILLING_MANAGER", "SUPPORT_AGENT"])
    .optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  department: z.string().trim().max(100).optional().nullable(),
  newPassword: z.string().min(10).max(128).optional(),
  forcePasswordReset: z.boolean().optional(),
  resetMfa: z.boolean().optional(),
  revokeSessions: z.boolean().optional(),
});

const strongAdminPasswordSchema = z
  .string()
  .min(12, "New password must be at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
  .regex(/[a-z]/, "New password must contain at least one lowercase letter")
  .regex(/[0-9]/, "New password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "New password must contain at least one special character");

export const platformChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: strongAdminPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password").max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current temporary password",
    path: ["newPassword"],
  });

export const platformTotpConfirmSchema = z.object({
  secret: z
    .string()
    .trim()
    .regex(/^[A-Z2-7]{16,64}$/i, "Invalid authenticator setup secret"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
});

export const platformMfaVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter your 6-digit authenticator code or recovery code")
    .max(32),
});

export const platformPasskeyChallengeSchema = z.object({
  purpose: z.enum(["register", "authenticate"]),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
});

export const platformPasskeyRegisterSchema = z.object({
  challengeToken: z.string().min(10, "Missing challenge token"),
  credentialId: z.string().min(8, "Invalid passkey credential ID").max(512),
  publicKeySpki: z.string().min(20, "Missing SPKI public key").max(4096),
  algorithm: z.number().int().default(-7),
  deviceName: z.string().trim().min(2).max(120).default("Security Key / Device Passkey"),
  clientDataJSON: z.string().min(10, "Missing clientDataJSON"),
});

export const platformPasskeyVerifySchema = z.object({
  challengeToken: z.string().min(10, "Missing challenge token"),
  credentialId: z.string().min(8, "Invalid passkey credential ID").max(512),
  clientDataJSON: z.string().min(10, "Missing clientDataJSON"),
  authenticatorData: z.string().min(10, "Missing authenticatorData"),
  signature: z.string().min(10, "Missing signature"),
});

export const platformContactOtpSendSchema = z.object({
  channel: z.enum(["EMAIL", "SMS"]),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid mobile number with country code or 10 digits")
    .max(20)
    .optional()
    .or(z.literal("")),
});

export const platformContactOtpVerifySchema = z.object({
  channel: z.enum(["EMAIL", "SMS"]),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export type ProvisionSchoolInput = z.input<typeof provisionSchoolSchema>;
export type UpdatePlatformSchoolInput = z.infer<typeof updatePlatformSchoolSchema>;
export type CreatePlatformSchoolUserInput = z.input<typeof createPlatformSchoolUserSchema>;
export type UpdatePlatformSchoolUserInput = z.infer<typeof updatePlatformSchoolUserSchema>;
export type PlatformSchoolDataPatchInput = z.infer<typeof platformSchoolDataPatchSchema>;
export type CreatePlatformInvoiceInput = z.input<typeof createPlatformInvoiceSchema>;
export type UpdatePlatformInvoiceInput = z.infer<typeof updatePlatformInvoiceSchema>;
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;
export type CreateAnnouncementInput = z.input<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type PlatformAdminLoginInput = z.infer<typeof platformAdminLoginSchema>;
export type CreatePlatformAdminInput = z.input<typeof createPlatformAdminSchema>;
export type UpdatePlatformAdminInput = z.infer<typeof updatePlatformAdminSchema>;
export type PlatformChangePasswordInput = z.infer<typeof platformChangePasswordSchema>;
export type PlatformTotpConfirmInput = z.infer<typeof platformTotpConfirmSchema>;
export type PlatformMfaVerifyInput = z.infer<typeof platformMfaVerifySchema>;
export type PlatformPasskeyChallengeInput = z.infer<typeof platformPasskeyChallengeSchema>;
export type PlatformPasskeyRegisterInput = z.infer<typeof platformPasskeyRegisterSchema>;
export type PlatformPasskeyVerifyInput = z.infer<typeof platformPasskeyVerifySchema>;
export type PlatformContactOtpSendInput = z.infer<typeof platformContactOtpSendSchema>;
export type PlatformContactOtpVerifyInput = z.infer<typeof platformContactOtpVerifySchema>;
