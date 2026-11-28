import { z } from "zod";

const CLEAN_TEXT = (max: number) => z.string().trim().min(1).max(max);
const OPT_TEXT = (max: number) => z.string().trim().max(max).optional().nullable();

export const communicationPrefsSchema = z.object({
  sms: z.boolean().default(true),
  email: z.boolean().default(true),
  whatsapp: z.boolean().default(true),
  inApp: z.boolean().default(true),
  feeReminders: z.boolean().default(true),
  attendanceAlerts: z.boolean().default(true),
  academicUpdates: z.boolean().default(true),
  mediaConsent: z.boolean().default(true),
});

export const wardLinkInputSchema = z.object({
  studentId: z.string().uuid(),
  relation: z.string().trim().min(1).max(60).default("Parent"),
  isPrimary: z.boolean().default(false),
  isEmergencyContact: z.boolean().default(true),
  canPickup: z.boolean().default(true),
  isFeePayer: z.boolean().default(false),
  receivesAcademicAlerts: z.boolean().default(true),
  receivesFeeAlerts: z.boolean().default(true),
  custodyNote: OPT_TEXT(500),
  restrictedContact: z.boolean().default(false),
});

export const createGuardianSchema = z.object({
  fullName: CLEAN_TEXT(200),
  phone: CLEAN_TEXT(30),
  alternatePhone: OPT_TEXT(30),
  email: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  occupation: OPT_TEXT(150),
  employer: OPT_TEXT(180),
  education: OPT_TEXT(150),
  preferredLanguage: z.string().trim().max(60).default("English"),
  address: z
    .object({
      addressLine1: OPT_TEXT(200),
      addressLine2: OPT_TEXT(200),
      city: OPT_TEXT(100),
      state: OPT_TEXT(100),
      postalCode: OPT_TEXT(20),
    })
    .optional()
    .nullable(),
  idProofType: OPT_TEXT(60),
  idProofMasked: OPT_TEXT(60),
  notes: OPT_TEXT(1000),
  communicationPrefs: communicationPrefsSchema.optional(),
  wards: z.array(wardLinkInputSchema).max(15).optional(),
  allowSharedPhone: z.boolean().default(false),
});

export const updateGuardianSchema = z.object({
  fullName: CLEAN_TEXT(200).optional(),
  phone: CLEAN_TEXT(30).optional(),
  alternatePhone: OPT_TEXT(30),
  email: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  occupation: OPT_TEXT(150),
  employer: OPT_TEXT(180),
  education: OPT_TEXT(150),
  preferredLanguage: OPT_TEXT(60),
  address: z
    .object({
      addressLine1: OPT_TEXT(200),
      addressLine2: OPT_TEXT(200),
      city: OPT_TEXT(100),
      state: OPT_TEXT(100),
      postalCode: OPT_TEXT(20),
    })
    .optional()
    .nullable(),
  idProofType: OPT_TEXT(60),
  idProofMasked: OPT_TEXT(60),
  notes: OPT_TEXT(1000),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  portalStatus: z.enum(["NOT_INVITED", "INVITED", "ACTIVE", "SUSPENDED"]).optional(),
  communicationPrefs: communicationPrefsSchema.partial().optional(),
});

export const unlinkWardSchema = z.object({
  studentId: z.string().uuid(),
});

export const mergeGuardiansSchema = z.object({
  targetGuardianId: z.string().uuid(),
  sourceGuardianIds: z.array(z.string().uuid()).min(1).max(10),
});

export const portalInviteSchema = z.object({
  guardianIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  action: z.enum(["INVITE", "ACTIVATE", "SUSPEND"]).default("INVITE"),
});

export const sendGuardianCommunicationSchema = z.object({
  guardianIds: z.array(z.string().uuid()).min(1).max(200),
  studentId: z.string().uuid().optional().nullable(),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP", "APP", "CALL"]).default("APP"),
  subject: OPT_TEXT(255),
  body: CLEAN_TEXT(2000),
});

export const autoLinkHouseholdsSchema = z.object({
  mode: z.enum(["PREVIEW", "APPLY"]).default("APPLY"),
});

export type WardLinkInput = z.infer<typeof wardLinkInputSchema>;
export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
export type MergeGuardiansInput = z.infer<typeof mergeGuardiansSchema>;
export type PortalInviteInput = z.infer<typeof portalInviteSchema>;
export type SendGuardianCommunicationInput = z.infer<typeof sendGuardianCommunicationSchema>;
