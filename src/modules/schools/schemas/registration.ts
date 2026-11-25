import { z } from "zod";

const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
const pinCodeRegex = /^[1-9][0-9]{5}$/;

export const institutionDetailsSchema = z.object({
  name: z
    .string()
    .min(2, "School / Institution name must be at least 2 characters")
    .max(200, "School name is too long"),
  category: z
    .string()
    .min(1, "Please select a school type or category")
    .default("Co-Educational School"),
  affiliationBoard: z.string().optional().default("CBSE"),
  contactPhone: z
    .string()
    .min(10, "Please enter a valid contact phone number")
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, "")), {
      message: "Please enter a valid 10-digit Indian mobile or landline number",
    }),
  website: z
    .string()
    .trim()
    .url("Please enter a valid website URL (e.g. https://www.school.edu.in)")
    .optional()
    .or(z.literal("")),
  addressLine: z.string().min(3, "Address line is required"),
  locality: z.string().optional().default(""),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().refine((val) => pinCodeRegex.test(val.trim()), {
    message: "Please enter a valid 6-digit Indian PIN code",
  }),
  country: z.string().default("India"),
  logoUrl: z.string().optional().nullable(),
});

export const administratorDetailsSchema = z
  .object({
    adminName: z
      .string()
      .min(2, "Administrator name must be at least 2 characters")
      .max(100),
    adminPhone: z
      .string()
      .min(10, "Valid 10-digit mobile number required")
      .refine((val) => phoneRegex.test(val.replace(/\s+/g, "")), {
        message: "Please enter a valid 10-digit Indian mobile number",
      }),
    adminEmail: z
      .string()
      .min(5, "Email address is required")
      .email("Please enter a valid email address"),
    designation: z.string().optional().default("Principal"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const completeRegistrationSchema = z.object({
  institution: institutionDetailsSchema,
  administrator: administratorDetailsSchema,
  plan: z.enum(["starter", "professional", "enterprise"]).optional().default("professional"),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
  registrationSessionId: z.string().max(128).nullable().optional(),
  emailVerificationToken: z.string().nullable().optional(),
  mobileVerificationToken: z.string().nullable().optional(),
  emailOtpCode: z.string().length(6).nullable().optional(),
  mobileOtpCode: z.string().length(6).nullable().optional(),
  otpCode: z.string().length(6).nullable().optional(), // Legacy compat
});

export type InstitutionDetailsInput = z.infer<typeof institutionDetailsSchema>;
export type AdministratorDetailsInput = z.infer<typeof administratorDetailsSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
