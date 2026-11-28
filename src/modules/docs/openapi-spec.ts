export interface OpenApiSpecDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    license: { name: string; url?: string };
    contact?: { name: string; email?: string };
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
  paths: Record<string, Record<string, unknown>>;
}

const jsonResponse = (description: string, schemaRef?: string) => ({
  description,
  content: schemaRef
    ? { "application/json": { schema: { $ref: schemaRef } } }
    : { "application/json": { schema: { type: "object" } } },
});

const errorResponses = {
  "400": jsonResponse("Validation or malformed request error", "#/components/schemas/ErrorResponse"),
  "401": jsonResponse("Authentication required or expired session", "#/components/schemas/ErrorResponse"),
  "403": jsonResponse("Insufficient RBAC permission or tenant mismatch", "#/components/schemas/ErrorResponse"),
  "404": jsonResponse("Requested tenant resource not found", "#/components/schemas/ErrorResponse"),
  "429": jsonResponse("Rate limit exceeded", "#/components/schemas/ErrorResponse"),
};

export const SCHOLONIX_OPENAPI_SPEC: OpenApiSpecDocument = {
  openapi: "3.0.3",
  info: {
    title: "ScholoNix Multi-Tenant School Management SaaS API",
    version: "1.0.0",
    description:
      "Authoritative REST API specification covering Health Probes, Authentication & Onboarding OTP, School Admissions & Fee Ledgers, the Student Management Suite (Enrolment, Promotion, Transfer, Groups, Settings, CSV/PDF Exports), and Company Admin Governance (backed by PostgreSQL RLS + Upstash Redis).",
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
    contact: {
      name: "ScholoNix Platform Engineering",
      email: "support@scholonix.local",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Deployment Origin",
    },
    {
      url: "http://localhost:3000",
      description: "Local Next.js Development Server",
    },
  ],
  tags: [
    { name: "Health", description: "Liveness and readiness probes for PostgreSQL, Redis, and app workers" },
    { name: "Auth & Onboarding", description: "School registration, session cookies, OTP verification, and password reset" },
    { name: "School Workspace", description: "Tenant dashboard overview and school context endpoints" },
    { name: "Admissions & Fees", description: "Enquiries, admission applications, documents, reminders, admitted roster, and fee ledgers" },
    { name: "Student Management", description: "Student roster, profile dossiers, academic year promotion, TC transfers, bulk operations, groups, and CSV import/export" },
    { name: "Platform Admin", description: "Company Super Admin / Operations APIs cached via Upstash Redis across all schools" },
    { name: "Platform Auth", description: "Company Admin login, TOTP MFA, passkey/WebAuthn, and password security" },
    { name: "Public & Feedback", description: "Public contact inquiries and in-portal feedback submission" },
  ],
  components: {
    securitySchemes: {
      SchoolSessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "scholonix_session",
        description: "HTTP-only signed session cookie scoped strictly to the authenticated school tenant and role.",
      },
      PlatformAdminCookie: {
        type: "apiKey",
        in: "cookie",
        name: "scholonix_platform_session",
        description: "HTTP-only MFA-verified cookie for Company Super Admin & Platform Governance endpoints.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            oneOf: [
              { type: "string" },
              {
                type: "object",
                properties: {
                  code: { type: "string", example: "VALIDATION_ERROR" },
                  message: { type: "string", example: "Invalid input payload." },
                },
              },
            ],
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          service: { type: "string", example: "ScholoNix" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", example: "principal@sunrise-academy.edu" },
          password: { type: "string", format: "password" },
          schoolSlug: { type: "string", example: "sunrise-academy" },
        },
      },
      RegisterSchoolRequest: {
        type: "object",
        required: ["schoolName", "adminName", "adminEmail", "adminPhone", "password"],
        properties: {
          schoolName: { type: "string", example: "Sunrise International School" },
          affiliationBoard: { type: "string", enum: ["CBSE", "ICSE", "IB", "STATE", "CAMBRIDGE", "OTHER"] },
          city: { type: "string", example: "Jaipur" },
          state: { type: "string", example: "Rajasthan" },
          adminName: { type: "string", example: "Rohan Mehta" },
          adminEmail: { type: "string", format: "email" },
          adminPhone: { type: "string", example: "+919876543210" },
          password: { type: "string", format: "password" },
          emailOtpToken: { type: "string" },
          phoneOtpToken: { type: "string" },
        },
      },
      StudentRecord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          schoolId: { type: "string", format: "uuid" },
          admissionNumber: { type: "string", example: "ADM2026-0192" },
          studentName: { type: "string", example: "Aarav Sharma" },
          gender: { type: "string", enum: ["Male", "Female", "Other"], nullable: true },
          dateOfBirth: { type: "string", nullable: true, example: "2016-05-11" },
          bloodGroup: { type: "string", nullable: true, example: "O+" },
          currentAcademicYear: { type: "string", example: "2025 – 2026" },
          currentGrade: { type: "string", example: "Class IV" },
          currentSection: { type: "string", example: "A" },
          currentRollNumber: { type: "string", nullable: true, example: "12" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"] },
          guardianName: { type: "string", example: "Rajesh Sharma" },
          guardianRelation: { type: "string", example: "Father" },
          guardianPhone: { type: "string", example: "9876543210" },
          guardianEmail: { type: "string", nullable: true },
          admissionDate: { type: "string", format: "date-time" },
        },
      },
      CreateStudentRequest: {
        type: "object",
        required: ["studentName", "academicYear", "grade", "guardianName", "guardianPhone"],
        properties: {
          studentName: { type: "string", example: "Diya Verma" },
          admissionNumber: { type: "string", example: "ADM2026-0195" },
          gender: { type: "string", enum: ["Male", "Female", "Other"] },
          dateOfBirth: { type: "string", example: "2015-08-14" },
          bloodGroup: { type: "string", example: "B+" },
          academicYear: { type: "string", example: "2025 – 2026" },
          grade: { type: "string", example: "Class VI" },
          section: { type: "string", example: "A" },
          rollNumber: { type: "string", example: "18" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"], default: "ACTIVE" },
          admissionType: { type: "string", enum: ["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"], default: "FRESH" },
          guardianName: { type: "string", example: "Anita Verma" },
          guardianRelation: { type: "string", example: "Mother" },
          guardianPhone: { type: "string", example: "9811112233" },
          guardianEmail: { type: "string", format: "email" },
        },
      },
      PromoteStudentsRequest: {
        type: "object",
        required: ["studentIds", "toAcademicYear", "toGrade"],
        properties: {
          studentIds: { type: "array", items: { type: "string", format: "uuid" } },
          toAcademicYear: { type: "string", example: "2026 – 2027" },
          toGrade: { type: "string", example: "Class V" },
          toSection: { type: "string", example: "A" },
          markAsAlumni: { type: "boolean", default: false },
          remarks: { type: "string", example: "Annual academic promotion batch" },
        },
      },
      TransferStudentRequest: {
        type: "object",
        required: ["studentId", "transferType"],
        properties: {
          studentId: { type: "string", format: "uuid" },
          transferType: { type: "string", enum: ["TRANSFER_IN", "TRANSFER_OUT"] },
          transferDate: { type: "string", example: "2026-04-01" },
          tcNumber: { type: "string", example: "TC-2026-0142" },
          counterpartySchool: { type: "string", example: "Greenfield Public School" },
          reason: { type: "string", example: "Family relocation" },
          clearanceStatus: { type: "string", enum: ["CLEARED", "PENDING"], default: "CLEARED" },
          toGrade: { type: "string" },
          toSection: { type: "string" },
          toAcademicYear: { type: "string" },
        },
      },
      BulkStudentsActionRequest: {
        type: "object",
        required: ["studentIds", "action"],
        properties: {
          studentIds: { type: "array", items: { type: "string", format: "uuid" } },
          action: { type: "string", enum: ["SET_STATUS", "ASSIGN_SECTION", "ADD_TO_GROUP", "REMOVE_FROM_GROUP"] },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"] },
          section: { type: "string", example: "B" },
          groupId: { type: "string", format: "uuid" },
          reason: { type: "string" },
        },
      },
      CreateStudentGroupRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Emerald House" },
          category: { type: "string", example: "HOUSE" },
          colorToken: { type: "string", example: "violet" },
          description: { type: "string" },
        },
      },
      StudentWorkspaceResponse: {
        type: "object",
        properties: {
          snapshot: {
            type: "object",
            properties: {
              schoolId: { type: "string", format: "uuid" },
              schoolName: { type: "string" },
              schoolSlug: { type: "string" },
              students: { type: "array", items: { $ref: "#/components/schemas/StudentRecord" } },
              academicYears: { type: "array", items: { type: "string" } },
              grades: { type: "array", items: { type: "string" } },
              sections: { type: "array", items: { type: "string" } },
            },
          },
          analytics: { type: "object" },
          filteredStudents: { type: "array", items: { $ref: "#/components/schemas/StudentRecord" } },
        },
      },
      FeePaymentRequest: {
        type: "object",
        required: ["applicationId", "amountPaise", "paymentMethod"],
        properties: {
          applicationId: { type: "string", format: "uuid" },
          amountPaise: { type: "integer", example: 1500000, description: "Exact integer amount in paise (minor currency units)." },
          paymentMethod: { type: "string", enum: ["UPI", "CARD", "NETBANKING", "CASH", "CHEQUE", "BANK_TRANSFER"] },
          referenceNumber: { type: "string", example: "UTR-2026-9988" },
          remarks: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        description: "Returns HTTP 200 when the Next.js server process is up.",
        responses: { "200": jsonResponse("Service healthy", "#/components/schemas/HealthResponse") },
      },
    },
    "/api/health/readiness": {
      get: {
        tags: ["Health"],
        summary: "Readiness probe (PostgreSQL & Redis)",
        description: "Verifies live connectivity to PostgreSQL and Upstash/Redis before serving traffic.",
        responses: { "200": jsonResponse("Dependencies ready"), "503": jsonResponse("One or more backing services unavailable") },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth & Onboarding"],
        summary: "Authenticate school staff, parent, or student user",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: { "200": jsonResponse("Authenticated with session cookie"), ...errorResponses },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth & Onboarding"],
        summary: "Sign out and revoke active session",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Session invalidated") },
      },
    },
    "/api/auth/session": {
      get: {
        tags: ["Auth & Onboarding"],
        summary: "Inspect current authenticated user & tenant membership",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Active user and school metadata"), "401": errorResponses["401"] },
      },
    },
    "/api/auth/otp": {
      post: {
        tags: ["Auth & Onboarding"],
        summary: "Send email or SMS verification OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["channel", "target", "purpose"],
                properties: {
                  channel: { type: "string", enum: ["email", "sms"] },
                  target: { type: "string", example: "admin@sunrise.edu" },
                  purpose: { type: "string", example: "school_registration" },
                },
              },
            },
          },
        },
        responses: { "200": jsonResponse("OTP sent with expiry metadata"), ...errorResponses },
      },
    },
    "/api/auth/otp/verify": {
      post: {
        tags: ["Auth & Onboarding"],
        summary: "Verify OTP and mint signed verification token",
        responses: { "200": jsonResponse("OTP verified with short-lived signed token"), ...errorResponses },
      },
    },
    "/api/auth/otp/status": {
      get: {
        tags: ["Auth & Onboarding"],
        summary: "Check OTP cooldown and delivery configuration status",
        responses: { "200": jsonResponse("Delivery provider and cooldown status") },
      },
    },
    "/api/auth/register-school": {
      post: {
        tags: ["Auth & Onboarding"],
        summary: "Self-serve tenant school provisioning & Principal signup",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterSchoolRequest" } } } },
        responses: { "201": jsonResponse("School tenant provisioned and signed in"), ...errorResponses },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth & Onboarding"],
        summary: "Complete OTP-verified password reset",
        responses: { "200": jsonResponse("Password updated securely"), ...errorResponses },
      },
    },
    "/api/school/dashboard": {
      get: {
        tags: ["School Workspace"],
        summary: "Fetch tenant dashboard KPIs and operational widgets",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Tenant dashboard summary"), ...errorResponses },
      },
    },
    "/api/school/schools": {
      get: {
        tags: ["School Workspace"],
        summary: "Fetch current authenticated school tenant profile",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("School configuration and contact profile"), ...errorResponses },
      },
    },
    "/api/school/students/overview": {
      get: {
        tags: ["Student Management"],
        summary: "Fetch Student Dashboard KPIs, charts, trends, and filtered roster",
        description: "Cached per school in Upstash Redis with query filtering by Academic Year, Grade, Section, Status, Gender, Group, Date Range, Search, Sort, and Page.",
        security: [{ SchoolSessionCookie: [] }],
        parameters: [
          { name: "academicYear", in: "query", schema: { type: "string" } },
          { name: "grade", in: "query", schema: { type: "string" } },
          { name: "section", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ALL", "ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"] } },
          { name: "gender", in: "query", schema: { type: "string", enum: ["ALL", "Male", "Female", "Other"] } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["admissionNumber", "studentName", "grade", "section", "admissionDate", "status"] } },
          { name: "sortDir", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
        ],
        responses: { "200": jsonResponse("Student workspace snapshot and computed analytics", "#/components/schemas/StudentWorkspaceResponse"), ...errorResponses },
      },
    },
    "/api/school/students": {
      get: {
        tags: ["Student Management"],
        summary: "List paginated students with multi-criteria filter and sort",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Paginated student records"), ...errorResponses },
      },
      post: {
        tags: ["Student Management"],
        summary: "Create/enroll a new student and initial academic-year enrollment",
        security: [{ SchoolSessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateStudentRequest" } } } },
        responses: { "201": jsonResponse("Created student record", "#/components/schemas/StudentRecord"), ...errorResponses },
      },
    },
    "/api/school/students/{studentId}": {
      get: {
        tags: ["Student Management"],
        summary: "Get full student profile dossier (enrollments, transfers, groups, fees)",
        security: [{ SchoolSessionCookie: [] }],
        parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Student dossier", "#/components/schemas/StudentRecord"), ...errorResponses },
      },
      patch: {
        tags: ["Student Management"],
        summary: "Update student details, grade/section, or lifecycle status",
        security: [{ SchoolSessionCookie: [] }],
        parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Updated student record", "#/components/schemas/StudentRecord"), ...errorResponses },
      },
    },
    "/api/school/students/promote": {
      post: {
        tags: ["Student Management"],
        summary: "Bulk promote, retain, or graduate active students to Alumni",
        security: [{ SchoolSessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PromoteStudentsRequest" } } } },
        responses: { "200": jsonResponse("Promotion summary with promotedCount"), ...errorResponses },
      },
    },
    "/api/school/students/transfer": {
      post: {
        tags: ["Student Management"],
        summary: "Process Student Transfer Out (TC) or Transfer In",
        security: [{ SchoolSessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TransferStudentRequest" } } } },
        responses: { "201": jsonResponse("Recorded transfer certificate event"), ...errorResponses },
      },
    },
    "/api/school/students/bulk": {
      post: {
        tags: ["Student Management"],
        summary: "Apply bulk status change, section assignment, or group membership",
        security: [{ SchoolSessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkStudentsActionRequest" } } } },
        responses: { "200": jsonResponse("Bulk update summary"), ...errorResponses },
      },
    },
    "/api/school/students/groups": {
      post: {
        tags: ["Student Management"],
        summary: "Create student house, transport route, club, or scholarship cohort",
        security: [{ SchoolSessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateStudentGroupRequest" } } } },
        responses: { "201": jsonResponse("Created group record"), ...errorResponses },
      },
    },
    "/api/school/students/settings": {
      patch: {
        tags: ["Student Management"],
        summary: "Update roll numbering, default sections, TC rules, and ID card layout settings",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Saved student settings"), ...errorResponses },
      },
    },
    "/api/school/students/import": {
      post: {
        tags: ["Student Management"],
        summary: "Bulk import student rows (up to 300 rows per batch)",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "201": jsonResponse("Imported student records summary"), ...errorResponses },
      },
    },
    "/api/school/students/export": {
      get: {
        tags: ["Student Management"],
        summary: "Export filtered students as RFC-4180 CSV spreadsheet",
        security: [{ SchoolSessionCookie: [] }],
        responses: {
          "200": {
            description: "CSV download stream",
            content: { "text/csv": { schema: { type: "string" } } },
          },
          ...errorResponses,
        },
      },
    },
    "/api/school/admissions/overview": {
      get: {
        tags: ["Admissions & Fees"],
        summary: "Get Admissions dashboard KPIs, pipeline stages, enquiries, and admitted summary",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Admissions overview snapshot"), ...errorResponses },
      },
    },
    "/api/school/admissions/applications": {
      get: {
        tags: ["Admissions & Fees"],
        summary: "List admission applications",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "200": jsonResponse("Admission applications list"), ...errorResponses },
      },
      post: {
        tags: ["Admissions & Fees"],
        summary: "Create new 4-step admission application",
        security: [{ SchoolSessionCookie: [] }],
        responses: { "201": jsonResponse("Created application"), ...errorResponses },
      },
    },
    "/api/school/admissions/applications/{applicationId}": {
      get: {
        tags: ["Admissions & Fees"],
        summary: "Get single admission application dossier",
        security: [{ SchoolSessionCookie: [] }],
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Application details"), ...errorResponses },
      },
      patch: {
        tags: ["Admissions & Fees"],
        summary: "Update admission application stage or verify candidate",
        security: [{ SchoolSessionCookie: [] }],
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Updated application"), ...errorResponses },
      },
    },
    "/api/school/admissions/applications/{applicationId}/pdf": {
      get: {
        tags: ["Admissions & Fees"],
        summary: "Generate downloadable A4 PDF dossier for an admission application",
        security: [{ SchoolSessionCookie: [] }],
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "PDF file stream", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } }, ...errorResponses },
      },
    },
    "/api/school/admissions/enquiries": {
      get: { tags: ["Admissions & Fees"], summary: "List admission leads and enquiries", security: [{ SchoolSessionCookie: [] }], responses: { "200": jsonResponse("Enquiries list"), ...errorResponses } },
      post: { tags: ["Admissions & Fees"], summary: "Log a new parent/student enquiry", security: [{ SchoolSessionCookie: [] }], responses: { "201": jsonResponse("Created enquiry"), ...errorResponses } },
    },
    "/api/school/admissions/admitted": {
      get: { tags: ["Admissions & Fees"], summary: "List admitted students and enrollment status", security: [{ SchoolSessionCookie: [] }], responses: { "200": jsonResponse("Admitted students list"), ...errorResponses } },
    },
    "/api/school/admissions/admitted/fees/ledger": {
      post: { tags: ["Admissions & Fees"], summary: "Create or update classwise student fee ledger", security: [{ SchoolSessionCookie: [] }], responses: { "200": jsonResponse("Fee ledger details"), ...errorResponses } },
    },
    "/api/school/admissions/admitted/fees/payments": {
      post: {
        tags: ["Admissions & Fees"],
        summary: "Record transactional fee payment and generate immutable receipt number",
        security: [{ SchoolSessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/FeePaymentRequest" } } } },
        responses: { "201": jsonResponse("Fee payment receipt created"), ...errorResponses },
      },
    },
    "/api/school/admissions/settings": {
      patch: { tags: ["Admissions & Fees"], summary: "Update admission cycle, academic year, and grade configuration", security: [{ SchoolSessionCookie: [] }], responses: { "200": jsonResponse("Updated admissions settings"), ...errorResponses } },
    },
    "/api/platform/overview": {
      get: {
        tags: ["Platform Admin"],
        summary: "Company Admin dashboard KPIs, MRR, SaaS plans, and signup trends (Upstash Redis cached)",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "days", in: "query", schema: { type: "integer", enum: [7, 30, 90, 365], default: 30 } }],
        responses: { "200": jsonResponse("Platform overview analytics"), ...errorResponses },
      },
    },
    "/api/platform/schools": {
      get: {
        tags: ["Platform Admin"],
        summary: "List/search all client schools directory",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "plan", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": jsonResponse("Schools directory entries"), ...errorResponses },
      },
      post: {
        tags: ["Platform Admin"],
        summary: "Provision a new client school & initial admin credentials",
        security: [{ PlatformAdminCookie: [] }],
        responses: { "201": jsonResponse("Provisioned school tenant"), ...errorResponses },
      },
    },
    "/api/platform/schools/{schoolId}": {
      patch: {
        tags: ["Platform Admin"],
        summary: "Update school profile, subscription plan, module entitlements, or suspension state",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Updated school governance record"), ...errorResponses },
      },
      delete: {
        tags: ["Platform Admin"],
        summary: "Delete tenant school (slug confirmation required)",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Deleted school"), ...errorResponses },
      },
    },
    "/api/platform/schools/{schoolId}/data": {
      get: {
        tags: ["Platform Admin"],
        summary: "Inspect tenant applications, enquiries, fee ledgers, receipts, and portal users",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Complete tenant inspection bundle"), ...errorResponses },
      },
    },
    "/api/platform/schools/{schoolId}/students": {
      get: {
        tags: ["Platform Admin"],
        summary: "Super Admin inspection of a client school's Student Management Suite",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Tenant student workspace data", "#/components/schemas/StudentWorkspaceResponse"), ...errorResponses },
      },
      post: {
        tags: ["Platform Admin"],
        summary: "Execute Super Admin student lifecycle action (CREATE_STUDENT, PROMOTE, TRANSFER, BULK, CREATE_GROUP, IMPORT)",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Lifecycle action executed"), ...errorResponses },
      },
      patch: {
        tags: ["Platform Admin"],
        summary: "Update student profile or tenant student settings as Platform Super Admin",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": jsonResponse("Updated student or settings"), ...errorResponses },
      },
    },
    "/api/platform/students/overview": {
      get: {
        tags: ["Platform Admin"],
        summary: "Global cross-school Student Analytics powered by Upstash Redis",
        security: [{ PlatformAdminCookie: [] }],
        parameters: [
          { name: "schoolId", in: "query", schema: { type: "string" } },
          { name: "academicYear", in: "query", schema: { type: "string" } },
          { name: "grade", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "gender", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": jsonResponse("Platform-wide student analytics rollup"), ...errorResponses },
      },
    },
    "/api/platform/schools/{schoolId}/users": {
      get: { tags: ["Platform Admin"], summary: "List all staff/admin/parent users in a school", security: [{ PlatformAdminCookie: [] }], parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": jsonResponse("Users list"), ...errorResponses } },
      post: { tags: ["Platform Admin"], summary: "Create user inside target school", security: [{ PlatformAdminCookie: [] }], parameters: [{ name: "schoolId", in: "path", required: true, schema: { type: "string" } }], responses: { "201": jsonResponse("User created"), ...errorResponses } },
    },
    "/api/platform/users": {
      get: { tags: ["Platform Admin"], summary: "Search global users across all client schools", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("Global users list"), ...errorResponses } },
    },
    "/api/platform/admins": {
      get: { tags: ["Platform Admin"], summary: "List Company Admin panel operators", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("Platform admins list"), ...errorResponses } },
      post: { tags: ["Platform Admin"], summary: "Invite or update Company Admin role", security: [{ PlatformAdminCookie: [] }], responses: { "201": jsonResponse("Platform admin created"), ...errorResponses } },
    },
    "/api/platform/billing": {
      get: { tags: ["Platform Admin"], summary: "Get SaaS subscriptions, MRR, and billing invoices", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("SaaS billing metrics"), ...errorResponses } },
    },
    "/api/platform/announcements": {
      get: { tags: ["Platform Admin"], summary: "List platform notices & announcements", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("Announcements list"), ...errorResponses } },
      post: { tags: ["Platform Admin"], summary: "Publish tenant broadcast announcement", security: [{ PlatformAdminCookie: [] }], responses: { "201": jsonResponse("Announcement published"), ...errorResponses } },
    },
    "/api/platform/audit-logs": {
      get: { tags: ["Platform Admin"], summary: "Query immutable platform and tenant audit trail", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("Audit logs feed"), ...errorResponses } },
    },
    "/api/platform/support": {
      get: { tags: ["Platform Admin"], summary: "List school support tickets & feedback", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("Support tickets"), ...errorResponses } },
    },
    "/api/platform/auth/login": {
      post: { tags: ["Platform Auth"], summary: "Authenticate Company Admin operator (with MFA/Passkey flow)", responses: { "200": jsonResponse("Auth response or MFA challenge"), ...errorResponses } },
    },
    "/api/platform/auth/mfa/totp": {
      post: { tags: ["Platform Auth"], summary: "Enroll or manage TOTP 2FA secret", security: [{ PlatformAdminCookie: [] }], responses: { "200": jsonResponse("TOTP setup details"), ...errorResponses } },
    },
    "/api/platform/auth/passkey/challenge": {
      post: { tags: ["Platform Auth"], summary: "Generate WebAuthn passkey challenge", responses: { "200": jsonResponse("WebAuthn challenge"), ...errorResponses } },
    },
    "/api/contact": {
      post: { tags: ["Public & Feedback"], summary: "Submit public demo or sales contact inquiry", responses: { "201": jsonResponse("Contact request received"), ...errorResponses } },
    },
    "/api/feedback": {
      post: { tags: ["Public & Feedback"], summary: "Submit in-portal school feedback or support ticket", security: [{ SchoolSessionCookie: [] }], responses: { "201": jsonResponse("Support ticket logged"), ...errorResponses } },
    },
  },
};
