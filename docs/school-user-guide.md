# ScholoNix School Uses & Operations Documentation

Welcome to **ScholoNix**, a multi-tenant cloud School Management SaaS platform built for principals, school administrators, admission counselors, accountants, teachers, parents, and students. This guide walks through every day-to-day workflow inside a school workspace.

---

## 1. School Onboarding & Signing In

1. **Register Your School (`/register`)**:
   - Enter school identity (Name, Board such as CBSE/ICSE/IB/State, City/State), Principal details, and contact details.
   - Complete Email/SMS OTP verification. ScholoNix provisions an isolated tenant database scope, a unique School ID, and your custom workspace slug (`/{schoolSlug}`).
2. **Sign In (`/login`)**:
   - Staff, Principals, Parents, and Students log in with their credentials and are routed straight into `/{schoolSlug}` (School Web Panel) or `/admin` / `/company-admin-pannel` (for Platform Operators).
3. **Light & Dark Mode (`ThemeToggle`)**:
   - Click the sun/moon toggle in the top header on any page to switch cleanly between **Light Mode** and **Dark Mode**. Preferences persist across browser tabs.

---

## 2. Roles & Access Control (RBAC)

| Role | What They Can Do |
| :--- | :--- |
| **Principal / School Admin** | Full school governance: dashboard KPIs, admissions, student promotion/transfer/settings, fee collection, exports, staff management, and school profile. |
| **Teacher** | View student dashboard & profiles, check attendance/class lists, and inspect assigned cohorts. Cannot promote/delete students or alter fee ledgers. |
| **Accountant** | Manage classwise fee plans, create ledgers, record payments, issue receipts, and export fee reports. |
| **Staff** | Assist with admission enquiries, student data entry, ID cards, and daily operational records. |
| **Parent / Guardian / Student** | View personal student profile, fee receipts, notices, and school help resources scoped strictly to their own record. |

---

## 3. Using Admissions (`/{schoolSlug}/admissions`)

The **Admissions** accordion in the sidebar covers the full intake funnel:
1. **Overview (`?tab=overview`)**: Live KPIs (Total Enquiries, Applications, Pending Review, Admitted, Fee Collected) and pipeline breakdown.
2. **Enquiries (`?tab=enquiries`)**: Log walk-in, phone, or website parent leads, assign follow-up reminders, and convert qualified leads into formal applications.
3. **Applications (`?tab=applications`)**: Run the 4-step admission form (Student info -> Guardian contacts -> Academic history -> Document uploads). Export any candidate dossier as an **A4 PDF** (`GET /api/school/admissions/applications/[id]/pdf`) or upload rows in bulk via CSV.
4. **Admitted Students & Fees (`?tab=admitted`)**: Confirm admission, assign an Admission Number, create the classwise Fee Ledger, and record installment payments with instant receipts.
5. **Admission Settings (`?tab=settings`)**: Configure active academic years, classes/grades, required documents, and admission number prefixes.

---

## 4. Using the Student Management Suite (`/{schoolSlug}/students`)

Click **Students** in the left sidebar to manage the complete student lifecycle after admission:

### 4.1 Student Dashboard (`/{schoolSlug}/students`)
- View **Total Students**, **Active Students**, **New Enrolments**, **Transferred**, and **Alumni** KPIs with period growth deltas.
- Filter live by **Academic Year**, **Grade**, **Section**, **Status**, **Gender**, **Date Range**, and **Search**.
- Analyze the **Student Enrolment Trend**, **Students by Status**, **Students by Grade**, and **Gender Distribution** charts, plus **Key Insights** and **Important Actions**.

### 4.2 Student List (`/{schoolSlug}/students/list`)
Use the pill sub-tabs inside **Student List**:
- **Student List**: Searchable, sortable, paginated table showing Admission No., Student Name, Guardian info, Grade/Section, Gender pill, Admission Date, and Status.
- **Bulk Actions**: Select checkboxes across multiple students to **Mark Active**, **Mark Inactive**, **Move Section**, or assign cohorts in one batch.
- **Student Groups**: Organize students into Houses (e.g., Emerald House), Bus/Transport Routes, Clubs, or Scholarship cohorts.
- **ID Cards**: Generate printable Student ID cards displaying student photo badge, admission number, class/section, blood group, and guardian phone (configured in Student Settings).
- **Export & Reports**: Download the filtered student roster as a spreadsheet CSV (`GET /api/school/students/export`).

### 4.3 Student Profile (`/{schoolSlug}/students/profile/[studentId]`)
Inspect an individual student's complete academic dossier:
- Identity header, status badge, roll number, admission date, blood group, and address.
- **Guardian & Contact** card with parent details and medical notes.
- **Fee Ledger & Groups** summary showing Total, Paid, and Due balances plus House/Club memberships.
- **Enrollment & Transfer Timeline** across academic years and **Activity Audit Trail**.
- Download the student's JSON dossier or open their printable ID card directly.

### 4.4 Student Enrolment (`/{schoolSlug}/students/enrolment`)
- Click **+ Add Student** to enroll a student directly into a Grade, Section, and Academic Year.
- Click **Import Students** to paste or upload multiple student rows via CSV (`POST /api/school/students/import`).

### 4.5 Student Promotion (`/{schoolSlug}/students/promotion`)
At the end of an academic session:
1. Filter active students by source Grade (or select all eligible students).
2. Choose **Promote to Next Grade**, **Retain in Target Grade**, or **Graduate to Alumni**.
3. Pick Target Academic Year, Target Grade, Target Section, and click **Apply** — creating new academic-year enrollment records atomically while preserving past years.

### 4.6 Student Transfer (`/{schoolSlug}/students/transfer`)
- **Transfer Out (TC)**: Record Transfer Certificate number, destination school, clearance status (`CLEARED` / `PENDING`), and reason. Automatically marks the student status as `TRANSFERRED`.
- **Transfer In**: Re-enroll returning/inbound transfer students back into active rosters and log full history in the **Transfer Registry**.

### 4.7 Inactive Students & Alumni (`/{schoolSlug}/students/inactive`, `/{schoolSlug}/students/alumni`)
- **Student Inactive**: Review withdrawn or temporarily inactive students and re-activate via Bulk Actions or Edit when they return.
- **Alumni**: Dedicated directory of graduated cohorts with passing year and historical academic records.

### 4.8 Student Settings (`/{schoolSlug}/students/settings`)
Configure:
- Default Sections per school (e.g., `A, B, C, D`)
- Roll Number assignment (`Auto Alphabetical` vs `Manual`)
- Whether TC number is mandatory before Transfer Out
- Final grade before graduating to Alumni (`Class XII`)
- ID Card footer motto and visible fields (Blood Group, Guardian Phone)

---

## 5. Help Center, Support & Feedback (`/{schoolSlug}/help`)

- School staff can browse step-by-step setup guides under `/help` or inside `/{schoolSlug}/help`.
- Use the profile dropdown -> **Contact Support** or **Give Feedback** to file tickets straight to the ScholoNix platform support team.

---

## 6. Company Admin Governance (`/{adminSlug}`)

Platform operators / Company Super Admins manage all tenant schools cleanly:
- **Global Students Analytics (`/{adminSlug}/clients/students`)**: Cross-school student metrics, charts, and drill-downs cached via **Upstash Redis**.
- **Client Schools (`/{adminSlug}/clients/schools/[schoolId]/students`)**: Deep inspection and Super Admin lifecycle management inside any client school's Student Suite, Users, Plan/Subscription, Admissions, Fees, and Audit Trail.

---

## 7. Multi-Tenant Data Safety & License

- Every tenant request executes inside strict **PostgreSQL Row-Level Security (RLS)** scoped by `schoolId`, paired with Redis cache key namespace isolation (`t:<schoolId>:...`).
- ScholoNix is licensed under the **MIT License** — see [LICENSE](file:///d:/ScholoNix/LICENSE).
