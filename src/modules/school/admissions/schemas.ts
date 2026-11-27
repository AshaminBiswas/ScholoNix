import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""));

const optionalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .optional()
  .nullable()
  .or(z.literal(""));

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number must have at least 7 characters")
  .max(25, "Phone number must not exceed 25 characters");

const documentChecklistItemSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  submitted: z.boolean(),
  verified: z.boolean(),
});

export const admissionAddressSchema = z.object({
  addressLine1: z.string().trim().max(255).default(""),
  addressLine2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(100).default(""),
  state: z.string().trim().max(100).default(""),
  postalCode: z.string().trim().max(20).default(""),
});

export const studentDetailsSchema = z.object({
  email: optionalEmailSchema,
  phone: z.string().trim().max(25).optional().or(z.literal("")),
  address: admissionAddressSchema,
});

export const guardianPersonSchema = z.object({
  fullName: z.string().trim().max(120).default(""),
  relationship: z.string().trim().max(60).default("Father"),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  annualIncome: z.string().trim().max(60).optional().or(z.literal("")),
  email: optionalEmailSchema,
  phone: z.string().trim().max(25).optional().or(z.literal("")),
});

export const guardianDetailsSchema = z.object({
  primary: guardianPersonSchema,
  secondary: guardianPersonSchema.optional().nullable(),
  sameAsStudentAddress: z.boolean().default(false),
  address: admissionAddressSchema.optional().nullable(),
  emergencyContactNumber: z.string().trim().max(25).default(""),
  preferredCommunicationMode: z
    .enum(["Phone", "Email", "SMS", "WhatsApp"])
    .default("Phone"),
});

export const previousAcademicRowSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    academicYear: z.string().trim().min(1).max(30),
    standard: z.string().trim().min(1).max(60),
    marksObtained: z.coerce.number().min(0).max(100000),
    totalMarks: z.coerce.number().positive().max(100000),
    percentage: z.coerce.number().min(0).max(100),
  })
  .refine((row) => row.marksObtained <= row.totalMarks, {
    message: "Marks obtained cannot exceed total marks.",
    path: ["marksObtained"],
  });

export const academicDetailsSchema = z
  .object({
    previousSchoolName: z.string().trim().max(200).optional().or(z.literal("")),
    boardCurriculum: z.string().trim().max(80).optional().or(z.literal("")),
    lastStandardStudied: z.string().trim().max(60).optional().or(z.literal("")),
    yearOfCompletion: z.string().trim().max(20).optional().or(z.literal("")),
    schoolAddress: z.string().trim().max(255).optional().or(z.literal("")),
    totalMarks: z.coerce.number().positive().max(100000).optional().nullable(),
    marksObtained: z.coerce.number().min(0).max(100000).optional().nullable(),
    percentage: z.coerce.number().min(0).max(100).optional().nullable(),
    previousAcademics: z.array(previousAcademicRowSchema).max(10).optional(),
  })
  .refine(
    (val) => {
      if (
        val.totalMarks !== undefined &&
        val.totalMarks !== null &&
        val.marksObtained !== undefined &&
        val.marksObtained !== null
      ) {
        return val.marksObtained <= val.totalMarks;
      }
      return true;
    },
    { message: "Marks obtained cannot exceed total marks.", path: ["marksObtained"] },
  );

export const uploadedDocumentSchema = z.object({
  key: z.string().trim().min(1).max(120),
  docType: z.enum([
    "student_photo",
    "father_aadhaar",
    "mother_aadhaar",
    "birth_certificate",
    "student_aadhaar",
    "last_marksheet",
  ]),
  label: z.string().trim().min(1).max(120),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  sizeBytes: z.coerce.number().int().positive().max(6 * 1024 * 1024),
  storageKey: z.string().trim().min(1).max(500),
  uploadedAt: z.string().trim().min(1).max(64),
});

export const createEnquirySchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required").max(120),
  studentDob: optionalDateSchema,
  studentGender: z.enum(["Male", "Female", "Other", ""]).optional().or(z.literal("")),
  guardianName: z.string().trim().min(2, "Guardian name is required").max(120),
  guardianRelation: z.string().trim().max(60).optional().or(z.literal("")),
  guardianPhone: phoneSchema,
  guardianEmail: optionalEmailSchema,
  addressLine1: z.string().trim().max(255).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  pinCode: z.string().trim().max(20).optional().or(z.literal("")),
  gradeApplied: z.string().trim().min(1, "Grade is required").max(60),
  academicYear: z.string().trim().min(4, "Academic year is required").max(30),
  enquiryDate: optionalDateSchema,
  source: z.string().trim().min(1, "Source is required").max(80).default("Walk-In"),
  enquiryType: z.string().trim().min(1).max(60).default("General"),
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"]).default("NEW"),
  assignedToUserId: z.string().uuid().optional().nullable().or(z.literal("")),
  assignedToName: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  hasSiblingsInSchool: z.boolean().default(false),
  interestedInTransport: z.boolean().default(false),
  interestedInHostel: z.boolean().default(false),
  requiresSpecialSupport: z.boolean().default(false),
  isDraft: z.boolean().default(false),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  initialFollowUp: z
    .object({
      followUpType: z
        .enum(["Phone Call", "Email", "WhatsApp", "Meeting", "Campus Visit"])
        .default("Phone Call"),
      scheduledAt: z.string().trim().min(10, "Follow-up date and time is required"),
      assignedToUserId: z.string().uuid().optional().nullable().or(z.literal("")),
      assignedToName: z.string().trim().max(255).optional().nullable().or(z.literal("")),
      notes: z.string().trim().max(500).optional().or(z.literal("")),
    })
    .optional()
    .nullable(),
});

export const updateEnquirySchema = z.object({
  action: z.enum(["update", "convert"]).default("update"),
  studentName: z.string().trim().min(2).max(120).optional(),
  studentDob: optionalDateSchema,
  studentGender: z.enum(["Male", "Female", "Other", ""]).optional().nullable(),
  guardianName: z.string().trim().min(2).max(120).optional(),
  guardianRelation: z.string().trim().max(60).optional().nullable(),
  guardianPhone: phoneSchema.optional(),
  guardianEmail: optionalEmailSchema,
  addressLine1: z.string().trim().max(255).optional().nullable(),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pinCode: z.string().trim().max(20).optional().nullable(),
  gradeApplied: z.string().trim().min(1).max(60).optional(),
  academicYear: z.string().trim().min(4).max(30).optional(),
  enquiryDate: optionalDateSchema,
  source: z.string().trim().min(1).max(80).optional(),
  enquiryType: z.string().trim().min(1).max(60).optional(),
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"]).optional(),
  assignedToUserId: z.string().uuid().optional().nullable().or(z.literal("")),
  assignedToName: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  hasSiblingsInSchool: z.boolean().optional(),
  interestedInTransport: z.boolean().optional(),
  interestedInHostel: z.boolean().optional(),
  requiresSpecialSupport: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createEnquirySourceSchema = z.object({
  name: z.string().trim().min(2, "Source name is required").max(80),
  description: z.string().trim().max(250).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  colorToken: z
    .enum(["violet", "sky", "cyan", "emerald", "amber", "indigo", "rose"])
    .default("violet"),
});

export const updateEnquirySourceSchema = z.object({
  id: z.string().uuid("Invalid source ID"),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(250).optional().nullable(),
  isActive: z.boolean().optional(),
  colorToken: z
    .enum(["violet", "sky", "cyan", "emerald", "amber", "indigo", "rose"])
    .optional(),
});

export const createEnquiryFollowUpSchema = z.object({
  followUpType: z
    .enum(["Phone Call", "Email", "WhatsApp", "Meeting", "Campus Visit"])
    .default("Phone Call"),
  scheduledAt: z.string().trim().min(10, "Follow-up date and time is required"),
  assignedToUserId: z.string().uuid().optional().nullable().or(z.literal("")),
  assignedToName: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  notes: z.string().trim().min(2, "Follow-up notes are required").max(500),
});

export const updateEnquiryFollowUpSchema = z.object({
  followUpId: z.string().uuid("Invalid follow-up ID"),
  followUpType: z
    .enum(["Phone Call", "Email", "WhatsApp", "Meeting", "Campus Visit"])
    .optional(),
  scheduledAt: z.string().trim().min(10).optional(),
  status: z.enum(["UPCOMING", "DUE_TODAY", "COMPLETED", "OVERDUE", "CANCELLED"]).optional(),
  assignedToUserId: z.string().uuid().optional().nullable().or(z.literal("")),
  assignedToName: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(500).optional(),
  outcome: z.string().trim().max(500).optional().nullable(),
});

export const createEnquiryCommunicationSchema = z.object({
  channel: z.enum(["Email", "SMS", "WhatsApp", "Phone Call"]),
  recipient: z.string().trim().min(2, "Recipient is required").max(255),
  cc: z.string().trim().max(255).optional().or(z.literal("")),
  bcc: z.string().trim().max(255).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Subject is required").max(255),
  message: z.string().trim().min(2, "Message is required").max(2000),
  status: z.enum(["SENT", "COMPLETED"]).optional(),
});

export const createEnquiryNoteSchema = z.object({
  category: z
    .enum(["Admission Related", "Parent Requirement", "Follow-up", "Other"])
    .default("Admission Related"),
  title: z.string().trim().min(2, "Note title is required").max(180),
  content: z.string().trim().min(2, "Note details are required").max(2000),
});

export const updateEnquiryNoteSchema = z.object({
  noteId: z.string().uuid("Invalid note ID"),
  category: z.enum(["Admission Related", "Parent Requirement", "Follow-up", "Other"]).optional(),
  title: z.string().trim().min(2).max(180).optional(),
  content: z.string().trim().min(2).max(2000).optional(),
});

export const createApplicationSchema = z
  .object({
    studentName: z.string().trim().min(2, "Student name is required").max(120),
    gender: z.enum(["Male", "Female", "Other", ""]).optional(),
    dateOfBirth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
      .optional()
      .or(z.literal("")),
    gradeApplied: z.string().trim().min(1, "Admission grade is required").max(60),
    academicYear: z.string().trim().min(4, "Academic year is required").max(30),
    guardianName: z.string().trim().min(2, "Guardian name is required").max(120),
    guardianRelation: z.string().trim().min(2).max(60).default("Parent"),
    guardianPhone: phoneSchema,
    guardianEmail: optionalEmailSchema,
    previousSchool: z.string().trim().max(200).optional().or(z.literal("")),
    status: z.enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED"]).default("UNDER_REVIEW"),
    enquiryId: z.string().uuid().optional().nullable(),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    admissionType: z.enum(["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"]).default("FRESH"),
    isDraft: z.boolean().default(false),
    currentStep: z.coerce.number().int().min(1).max(4).default(1),
    studentPhotoKey: z.string().trim().max(500).optional().nullable(),
    nationality: z.string().trim().max(80).optional().or(z.literal("")),
    bloodGroup: z.string().trim().max(20).optional().or(z.literal("")),
    studentIdNumber: z.string().trim().max(60).optional().or(z.literal("")),
    studentDetails: studentDetailsSchema.optional().nullable(),
    guardianDetails: guardianDetailsSchema.optional().nullable(),
    academicDetails: academicDetailsSchema.optional().nullable(),
    uploadedDocuments: z.array(uploadedDocumentSchema).max(20).optional(),
    declarationAccepted: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    // Only enforce full multi-step wizard requirements when submitting a wizard application (not a draft, and when wizard payload is present)
    const isWizardSubmission = !val.isDraft && Boolean(val.studentDetails || val.guardianDetails);
    if (!isWizardSubmission) return;

    if (!val.gender) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gender is required.", path: ["gender"] });
    }
    if (!val.dateOfBirth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of Birth is required.",
        path: ["dateOfBirth"],
      });
    }
    if (!val.nationality?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nationality is required.",
        path: ["nationality"],
      });
    }
    if (!val.studentDetails?.address.addressLine1.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address Line 1 is required.",
        path: ["studentDetails", "address", "addressLine1"],
      });
    }
    if (!val.studentDetails?.address.city.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required.",
        path: ["studentDetails", "address", "city"],
      });
    }
    if (!val.studentDetails?.address.state.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required.",
        path: ["studentDetails", "address", "state"],
      });
    }
    if (!val.studentDetails?.address.postalCode.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Postal Code is required.",
        path: ["studentDetails", "address", "postalCode"],
      });
    }
    if (!val.guardianDetails?.emergencyContactNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Emergency Contact Number is required.",
        path: ["guardianDetails", "emergencyContactNumber"],
      });
    }
    if (val.admissionType === "TRANSFER") {
      if (!val.academicDetails?.previousSchoolName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Previous School Name is required for Transfer Admission.",
          path: ["academicDetails", "previousSchoolName"],
        });
      }
      if (!val.academicDetails?.boardCurriculum?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Board / Curriculum is required for Transfer Admission.",
          path: ["academicDetails", "boardCurriculum"],
        });
      }
      if (!val.academicDetails?.lastStandardStudied?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Last Standard Studied is required for Transfer Admission.",
          path: ["academicDetails", "lastStandardStudied"],
        });
      }
      if (!val.academicDetails?.yearOfCompletion?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Year of Completion is required for Transfer Admission.",
          path: ["academicDetails", "yearOfCompletion"],
        });
      }
      if (
        val.academicDetails?.totalMarks === undefined ||
        val.academicDetails?.totalMarks === null ||
        val.academicDetails?.marksObtained === undefined ||
        val.academicDetails?.marksObtained === null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Total Marks and Marks Obtained are required for Transfer Admission.",
          path: ["academicDetails", "marksObtained"],
        });
      }
    }
    if (!val.declarationAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the declaration before submitting.",
        path: ["declarationAccepted"],
      });
    }
  });

export const updateApplicationSchema = z.object({
  status: z
    .enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED", "ADMITTED", "REJECTED"])
    .optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  verificationNotes: z.string().trim().max(500).optional().nullable(),
  documentsChecklist: z.array(documentChecklistItemSchema).max(20).optional(),
  studentName: z.string().trim().min(2).max(120).optional(),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  gradeApplied: z.string().trim().min(1).max(60).optional(),
  academicYear: z.string().trim().min(4).max(30).optional(),
  guardianName: z.string().trim().min(2).max(120).optional(),
  guardianRelation: z.string().trim().min(2).max(60).optional(),
  guardianPhone: phoneSchema.optional(),
  guardianEmail: optionalEmailSchema,
  previousSchool: z.string().trim().max(200).optional().nullable(),
  admissionType: z.enum(["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"]).optional(),
  isDraft: z.boolean().optional(),
  currentStep: z.coerce.number().int().min(1).max(4).optional(),
  studentPhotoKey: z.string().trim().max(500).optional().nullable(),
  nationality: z.string().trim().max(80).optional().nullable(),
  bloodGroup: z.string().trim().max(20).optional().nullable(),
  studentIdNumber: z.string().trim().max(60).optional().nullable(),
  studentDetails: studentDetailsSchema.optional().nullable(),
  guardianDetails: guardianDetailsSchema.optional().nullable(),
  academicDetails: academicDetailsSchema.optional().nullable(),
  uploadedDocuments: z.array(uploadedDocumentSchema).max(20).optional(),
  declarationAccepted: z.boolean().optional(),
});

export const admissionExtendedSettingsSchema = z
  .object({
    admissionMode: z.enum(["ONLINE_OFFLINE", "ONLINE_ONLY", "OFFLINE_ONLY"]).default("ONLINE_OFFLINE"),
    gradeRangeFrom: z.string().trim().min(1).max(60).default("Nursery"),
    gradeRangeTo: z.string().trim().min(1).max(60).default("Class XII"),
    admissionEnabled: z.boolean().default(true),
    startDate: optionalDateSchema,
    lateAdmissionEnabled: z.boolean().default(true),
    lateFeeAmount: z.number().finite().min(0).max(500_000).default(500),
    onlineFormEnabled: z.boolean().default(true),
    allowGradeSelection: z.boolean().default(true),
    allowMultipleApplications: z.boolean().default(false),
    applicationFeeEnabled: z.boolean().default(true),
    applicationFeeAmount: z.number().finite().min(0).max(500_000).default(1000),
    documentRequirements: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(60),
          label: z.string().trim().min(1, "Document label is required").max(120),
          mandatory: z.boolean().default(true),
        }),
      )
      .max(25),
    approvalProcess: z.enum(["MULTI_LEVEL", "SINGLE_LEVEL", "AUTO_APPROVE"]).default("MULTI_LEVEL"),
    criteriaEnabled: z.boolean().default(true),
    criteriaType: z.enum(["AGE_BASED", "MERIT_BASED", "AGE_AND_MERIT"]).default("AGE_BASED"),
    minAgeYears: z.number().finite().min(0).max(30).default(3),
    maxAgeYears: z.number().finite().min(1).max(40).default(18),
    ageAsOfDate: optionalDateSchema.transform((v) => v || `${new Date().getFullYear()}-03-31`),
    minPercentage: z.number().finite().min(0).max(100).default(50),
    totalSeatsPerClass: z.number().int().min(1).max(2000).default(60),
    quotas: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(60),
          name: z.string().trim().min(1, "Quota name is required").max(80),
          percentage: z.number().finite().min(0).max(100),
        }),
      )
      .max(20),
    sendConfirmationNotification: z.boolean().default(true),
    sendVerificationUpdates: z.boolean().default(true),
    notifyApprovalRejection: z.boolean().default(true),
    enableOfferLetter: z.boolean().default(true),
    emailTemplate: z.string().trim().min(1).max(100).default("Admission Confirmation"),
    smsTemplate: z.string().trim().min(1).max(100).default("Application Received"),
    crmIntegrationEnabled: z.boolean().default(true),
    referralCodeEnabled: z.boolean().default(false),
    customFields: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(60),
          label: z.string().trim().min(1, "Field label is required").max(100),
          type: z.enum(["text", "number", "date", "select"]).default("text"),
          required: z.boolean().default(false),
        }),
      )
      .max(25)
      .default([]),
  })
  .superRefine((val, ctx) => {
    const quotaTotal = val.quotas.reduce((sum, q) => sum + q.percentage, 0);
    if (quotaTotal > 100.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total seat quota percentages cannot exceed 100%.",
        path: ["quotas"],
      });
    }
    if (val.maxAgeYears < val.minAgeYears) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum Age must be greater than or equal to Minimum Age.",
        path: ["maxAgeYears"],
      });
    }
  });

export const updateAdmissionsSettingsSchema = z.object({
  currentAcademicYear: z.string().trim().min(4).max(30),
  applicationDeadline: optionalDateSchema,
  applicationPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,8}$/, "Prefix must be 2-8 uppercase letters"),
  enabledGrades: z
    .array(z.string().trim().min(1).max(60))
    .min(1, "Select at least one admission grade")
    .max(25),
  extendedConfig: admissionExtendedSettingsSchema.optional(),
});

export const createReminderSchema = z.object({
  title: z.string().trim().min(3, "Reminder text must be at least 3 characters").max(240),
  academicYear: z.string().trim().min(4).max(30).optional().nullable(),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional()
    .nullable()
    .or(z.literal("")),
  priority: z.enum(["INFO", "WARNING"]).default("INFO"),
});

export const updateReminderSchema = z.object({
  isCompleted: z.boolean(),
});

export const bulkImportApplicationsSchema = z.object({
  applications: z
    .array(createApplicationSchema)
    .min(1, "Include at least one application row to import")
    .max(100, "Import at most 100 applications per batch"),
});

export const bulkUpdateApplicationsSchema = z
  .object({
    applicationIds: z
      .array(z.string().uuid("Invalid application ID"))
      .min(1, "Select at least one application")
      .max(100, "Bulk update is limited to 100 applications at once"),
    status: z
      .enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED", "ADMITTED", "REJECTED"])
      .optional(),
    verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
    verificationNotes: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (val) =>
      val.status !== undefined ||
      val.verificationStatus !== undefined ||
      val.verificationNotes !== undefined,
    { message: "Provide at least one field to update across selected applications." },
  );

export const directAdmitStudentSchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required").max(120),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  dateOfBirth: optionalDateSchema,
  gradeApplied: z.string().trim().min(1, "Grade is required").max(60),
  academicYear: z.string().trim().min(4, "Academic year is required").max(30),
  guardianName: z.string().trim().min(2, "Guardian name is required").max(120),
  guardianRelation: z.string().trim().min(2).max(60).default("Parent"),
  guardianPhone: phoneSchema,
  guardianEmail: optionalEmailSchema,
  admissionType: z.enum(["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"]).default("FRESH"),
  enrollmentStatus: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN"]).default("ACTIVE"),
  admittedAt: optionalDateSchema,
  previousSchool: z.string().trim().max(200).optional().or(z.literal("")),
  bloodGroup: z.string().trim().max(20).optional().or(z.literal("")),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
  totalFeeRupees: z.coerce.number().min(0).max(100_000_000).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const importAdmittedStudentsSchema = z.object({
  students: z
    .array(directAdmitStudentSchema)
    .min(1, "Include at least one admitted student row to import")
    .max(100, "Import at most 100 admitted students per batch"),
});

export const updateAdmittedEnrollmentSchema = z.object({
  enrollmentStatus: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN"]).optional(),
  admissionType: z.enum(["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"]).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const upsertAdmittedFeeLedgerSchema = z
  .object({
    applicationId: z.string().uuid("Invalid admitted student application ID"),
    totalFeeRupees: z.coerce.number().min(0, "Total fee cannot be negative").max(100_000_000),
    concessionRupees: z.coerce.number().min(0, "Concession cannot be negative").max(100_000_000).default(0),
    concessionReason: z.string().trim().max(255).optional().or(z.literal("")),
  })
  .refine((val) => val.concessionRupees <= val.totalFeeRupees, {
    message: "Concession cannot exceed total fee.",
    path: ["concessionRupees"],
  });

export const recordAdmittedFeePaymentSchema = z.object({
  applicationId: z.string().uuid("Invalid admitted student application ID"),
  idempotencyKey: z.string().trim().min(8, "Idempotency key is required").max(80),
  feeHead: z
    .enum(["Admission Fee", "Tuition Fee", "Annual Charges", "Transport Fee", "Hostel Fee"])
    .default("Admission Fee"),
  amountRupees: z.coerce.number().positive("Payment amount must be greater than zero").max(100_000_000),
  paymentDate: optionalDateSchema,
  paymentMode: z.enum(["UPI", "Net Banking", "Card", "Cash", "Cheque"]),
  referenceNo: z.string().trim().max(120).optional().or(z.literal("")),
  remarks: z.string().trim().max(255).optional().or(z.literal("")),
});

export type CreateEnquiryInput = z.input<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type CreateEnquirySourceInput = z.input<typeof createEnquirySourceSchema>;
export type UpdateEnquirySourceInput = z.infer<typeof updateEnquirySourceSchema>;
export type CreateEnquiryFollowUpInput = z.input<typeof createEnquiryFollowUpSchema>;
export type UpdateEnquiryFollowUpInput = z.infer<typeof updateEnquiryFollowUpSchema>;
export type CreateEnquiryCommunicationInput = z.input<typeof createEnquiryCommunicationSchema>;
export type CreateEnquiryNoteInput = z.input<typeof createEnquiryNoteSchema>;
export type UpdateEnquiryNoteInput = z.infer<typeof updateEnquiryNoteSchema>;
export type CreateApplicationInput = z.input<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateAdmissionsSettingsInput = z.infer<typeof updateAdmissionsSettingsSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type BulkImportApplicationsInput = z.infer<typeof bulkImportApplicationsSchema>;
export type BulkUpdateApplicationsInput = z.infer<typeof bulkUpdateApplicationsSchema>;
export type DirectAdmitStudentInput = z.input<typeof directAdmitStudentSchema>;
export type ImportAdmittedStudentsInput = z.input<typeof importAdmittedStudentsSchema>;
export type UpdateAdmittedEnrollmentInput = z.infer<typeof updateAdmittedEnrollmentSchema>;
export type UpsertAdmittedFeeLedgerInput = z.input<typeof upsertAdmittedFeeLedgerSchema>;
export type RecordAdmittedFeePaymentInput = z.input<typeof recordAdmittedFeePaymentSchema>;
