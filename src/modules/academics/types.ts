export type AcademicNavSection = "explorer" | "classes" | "sections" | "years";

export interface AcademicSessionRecord {
  id: string;
  schoolId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  status: "UPCOMING" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

export interface AcademicSubjectRecord {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  category: "CORE" | "ELECTIVE" | "LAB" | "CO_SCHOLASTIC";
  defaultMaxMarks: number;
  defaultPassMarks: number;
  status: "ACTIVE" | "ARCHIVED";
}

export interface ClassSubjectMappingRecord {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectCategory: "CORE" | "ELECTIVE" | "LAB" | "CO_SCHOLASTIC";
  academicYear: string;
  teacherName: string | null;
  weeklyPeriods: number;
  maxMarks: number;
  passMarks: number;
  isCompulsory: boolean;
  isActive: boolean;
}

export interface AcademicTreeGuardianNode {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  email: string | null;
  isPrimary: boolean;
  canPickup: boolean;
  isFeePayer: boolean;
  restrictedContact: boolean;
  portalStatus: string;
  siblingNames: string[];
}

export interface AcademicTreeStudentNode {
  id: string;
  admissionNumber: string;
  studentName: string;
  rollNumber: string | null;
  gender: string | null;
  status: string;
  grade: string;
  section: string;
  academicYear: string;
  guardians: AcademicTreeGuardianNode[];
}

export interface AcademicSectionNode {
  id: string;
  schoolId: string;
  classId: string;
  academicYear: string;
  name: string;
  capacity: number;
  roomNumber: string | null;
  classTeacherName: string | null;
  status: "ACTIVE" | "ARCHIVED";
  students: AcademicTreeStudentNode[];
}

export interface AcademicClassNode {
  id: string;
  schoolId: string;
  academicYear: string;
  name: string;
  code: string | null;
  department: string;
  displayOrder: number;
  status: "ACTIVE" | "ARCHIVED";
  subjects: ClassSubjectMappingRecord[];
  sections: AcademicSectionNode[];
  studentCount: number;
  guardianCount: number;
}

export interface AcademicWorkspaceSnapshot {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  activeAcademicYear: string;
  sessions: AcademicSessionRecord[];
  subjects: AcademicSubjectRecord[];
  classes: AcademicClassNode[];
  kpis: {
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    totalStudents: number;
    totalLinkedGuardians: number;
  };
}
