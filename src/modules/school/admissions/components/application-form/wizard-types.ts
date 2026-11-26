import type {
  AdmissionApplicationRecord,
  AdmissionCommunicationMode,
  AdmissionDocumentType,
  AdmissionPreviousAcademicRow,
  AdmissionTypeValue,
  AdmissionUploadedDocument,
} from "@/modules/school/admissions/types";

export interface ApplicationWizardFormState {
  draftId: string | null;
  academicYear: string;
  // Step 1: Student Details
  studentPhotoKey: string | null;
  studentName: string;
  dateOfBirth: string;
  gender: "" | "Male" | "Female" | "Other";
  nationality: string;
  gradeApplied: string;
  studentIdNumber: string;
  studentEmail: string;
  studentPhone: string;
  studentAddressLine1: string;
  studentAddressLine2: string;
  studentCity: string;
  studentState: string;
  studentPostalCode: string;

  // Step 2: Parent / Guardian Info
  primaryName: string;
  primaryRelationship: string;
  primaryOccupation: string;
  primaryAnnualIncome: string;
  primaryEmail: string;
  primaryPhone: string;

  secondaryName: string;
  secondaryRelationship: string;
  secondaryOccupation: string;
  secondaryAnnualIncome: string;
  secondaryEmail: string;
  secondaryPhone: string;

  sameAsStudentAddress: boolean;
  guardianAddressLine1: string;
  guardianAddressLine2: string;
  guardianCity: string;
  guardianState: string;
  guardianPostalCode: string;

  emergencyContactNumber: string;
  preferredCommunicationMode: AdmissionCommunicationMode;

  // Step 3: Academic Details & Documents
  admissionType: AdmissionTypeValue;
  bloodGroup: string;
  previousSchoolName: string;
  boardCurriculum: string;
  lastStandardStudied: string;
  yearOfCompletion: string;
  previousSchoolAddress: string;
  totalMarks: string;
  marksObtained: string;
  previousAcademics: AdmissionPreviousAcademicRow[];

  uploadedDocuments: Partial<Record<AdmissionDocumentType, AdmissionUploadedDocument>>;

  // Step 4: Declaration
  declarationAccepted: boolean;
}

export const NATIONALITY_OPTIONS = [
  "Indian",
  "NRI / OCI",
  "Nepalese",
  "Bhutanese",
  "Other",
] as const;

export const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const BOARD_CURRICULUM_OPTIONS = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "IB",
  "Cambridge (IGCSE)",
  "NIOS",
  "Other",
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other",
] as const;

export function buildInitialWizardState(params: {
  defaultGrade: string;
  defaultAcademicYear: string;
  draft?: AdmissionApplicationRecord | null;
}): ApplicationWizardFormState {
  const { defaultGrade, defaultAcademicYear, draft } = params;

  const docsMap: Partial<Record<AdmissionDocumentType, AdmissionUploadedDocument>> = {};
  if (draft?.uploadedDocuments) {
    for (const doc of draft.uploadedDocuments) {
      docsMap[doc.docType] = doc;
    }
  }

  const sd = draft?.studentDetails;
  const gd = draft?.guardianDetails;
  const ad = draft?.academicDetails;

  return {
    draftId: draft?.id ?? null,
    academicYear: draft?.academicYear || defaultAcademicYear,

    studentPhotoKey: draft?.studentPhotoKey ?? docsMap.student_photo?.storageKey ?? null,
    studentName: draft?.studentName || "",
    dateOfBirth: draft?.dateOfBirth || "",
    gender: (draft?.gender as "" | "Male" | "Female" | "Other") || "",
    nationality: draft?.nationality || "Indian",
    gradeApplied: draft?.gradeApplied || defaultGrade,
    studentIdNumber: draft?.studentIdNumber || "",
    studentEmail: sd?.email || "",
    studentPhone: sd?.phone || "",
    studentAddressLine1: sd?.address?.addressLine1 || "",
    studentAddressLine2: sd?.address?.addressLine2 || "",
    studentCity: sd?.address?.city || "",
    studentState: sd?.address?.state || "",
    studentPostalCode: sd?.address?.postalCode || "",

    primaryName: gd?.primary?.fullName || draft?.guardianName || "",
    primaryRelationship: gd?.primary?.relationship || draft?.guardianRelation || "Father",
    primaryOccupation: gd?.primary?.occupation || "",
    primaryAnnualIncome: gd?.primary?.annualIncome || "",
    primaryEmail: gd?.primary?.email || draft?.guardianEmail || "",
    primaryPhone: gd?.primary?.phone || draft?.guardianPhone || "",

    secondaryName: gd?.secondary?.fullName || "",
    secondaryRelationship: gd?.secondary?.relationship || "Mother",
    secondaryOccupation: gd?.secondary?.occupation || "",
    secondaryAnnualIncome: gd?.secondary?.annualIncome || "",
    secondaryEmail: gd?.secondary?.email || "",
    secondaryPhone: gd?.secondary?.phone || "",

    sameAsStudentAddress: gd?.sameAsStudentAddress ?? false,
    guardianAddressLine1: gd?.address?.addressLine1 || "",
    guardianAddressLine2: gd?.address?.addressLine2 || "",
    guardianCity: gd?.address?.city || "",
    guardianState: gd?.address?.state || "",
    guardianPostalCode: gd?.address?.postalCode || "",

    emergencyContactNumber: gd?.emergencyContactNumber || "",
    preferredCommunicationMode: gd?.preferredCommunicationMode || "Phone",

    admissionType: draft?.admissionType || "FRESH",
    bloodGroup: draft?.bloodGroup || "",
    previousSchoolName: ad?.previousSchoolName || draft?.previousSchool || "",
    boardCurriculum: ad?.boardCurriculum || "",
    lastStandardStudied: ad?.lastStandardStudied || "",
    yearOfCompletion: ad?.yearOfCompletion || "",
    previousSchoolAddress: ad?.schoolAddress || "",
    totalMarks: ad?.totalMarks != null ? String(ad.totalMarks) : "",
    marksObtained: ad?.marksObtained != null ? String(ad.marksObtained) : "",
    previousAcademics: ad?.previousAcademics ? [...ad.previousAcademics] : [],

    uploadedDocuments: docsMap,
    declarationAccepted: Boolean(draft?.declarationAccepted),
  };
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function computePercentageString(obtainedRaw: string, totalRaw: string): string {
  const obtained = Number(obtainedRaw);
  const total = Number(totalRaw);
  if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0 || obtained < 0) {
    return "Auto-calculated";
  }
  if (obtained > total) {
    return "Invalid (> 100%)";
  }
  return `${((obtained / total) * 100).toFixed(1)}%`;
}

export function computeAgeFromDob(dob: string): string | null {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  let months = now.getUTCMonth() - birth.getUTCMonth();
  if (now.getUTCDate() < birth.getUTCDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return `${years} Years, ${months} Months`;
}

export function buildDocumentViewUrl(schoolSlug: string, storageKey: string): string {
  return `/api/school/admissions/documents/view?schoolSlug=${encodeURIComponent(schoolSlug)}&key=${encodeURIComponent(storageKey)}`;
}
