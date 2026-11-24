# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## School Management SaaS Platform

**Document Version:** 1.0  
**Status:** Planning / Approved  
**Product Type:** Multi-Tenant SaaS  
**Target Market:** India  
**Initial Development Model:** Solo Developer

---

# 1. Executive Summary

## 1.1 Product Overview

The School Management SaaS Platform is a centralized, cloud-based school administration and academic management solution designed to digitize and simplify everyday school operations.

The platform will allow schools to manage students, admissions, attendance, fees, examinations, academic records, communication, homework, documents, staff, and administrative activities through a unified dashboard.

The software follows a multi-tenant SaaS model, allowing multiple schools to register and operate independently on the same application infrastructure while ensuring strict data isolation between institutions.

Each registered school receives its own secure workspace, institutional settings, academic configuration, user accounts, and school-specific records.

## 1.2 Product Vision

To build a reliable and scalable school management ecosystem that reduces administrative workload, improves institutional efficiency, and makes school operations more transparent, accessible, and data-driven.

## 1.3 Product Mission

- Digitize school administration and academic operations.
- Reduce manual paperwork and repetitive data entry.
- Improve communication between schools, teachers, students, and parents.
- Provide accurate academic and financial records.
- Enable schools to make better decisions using centralized reports and analytics.
- Make professional school management software accessible to institutions of different sizes.

---

# 2. Problem Statement

Many schools still depend on spreadsheets, paper registers, manual fee records, disconnected applications, and traditional communication methods.

These practices create several problems:

1. Student information is scattered across different records.
2. Admission processes require excessive manual work.
3. Attendance tracking and reporting are time-consuming.
4. Fee collection and outstanding balances are difficult to monitor.
5. Examination and marksheet preparation require manual calculations.
6. Parents do not receive timely academic updates.
7. Historical student records are difficult to retrieve.
8. Administrative reports are not available in real time.
9. Data duplication and human errors are common.
10. School management lacks a centralized operational overview.

The proposed platform addresses these problems through an integrated school management system.

---

# 3. Product Objectives

## 3.1 Primary Objectives

- Provide a centralized school management platform.
- Support multiple schools through a single SaaS application.
- Maintain strict tenant-level data isolation.
- Simplify admission and student lifecycle management.
- Automate attendance and fee management workflows.
- Manage examinations, marks, grades, and report cards.
- Improve school-to-parent communication.
- Provide actionable dashboards and reports.
- Maintain reliable historical records.
- Support future expansion without major architectural changes.

## 3.2 Business Objectives

- Acquire schools as paying customers.
- Offer subscription-based access.
- Reduce onboarding time for new schools.
- Support different school sizes and academic structures.
- Introduce additional paid modules in the future.
- Build a product that can scale across different regions of India.

## 3.3 Success Metrics

| Metric             | Measurement                              |
| ------------------ | ---------------------------------------- |
| School onboarding  | Successful school registrations          |
| Activation rate    | Schools completing initial configuration |
| Student adoption   | Active student records per school        |
| User adoption      | Monthly active users                     |
| Attendance usage   | Attendance records created               |
| Fee management     | Fee transactions recorded                |
| System performance | API response time and page load time     |
| Reliability        | Application uptime and error rate        |
| Customer retention | Renewing schools                         |
| Support quality    | Support resolution time                  |

---

# 4. Target Users

## 4.1 Primary Customers

- Private schools
- Primary schools
- Secondary schools
- Higher secondary schools
- Small and medium-sized educational institutions
- Multi-branch school organizations

## 4.2 User Personas

### A. SaaS Super Administrator

Responsible for managing the overall SaaS platform (schools, subscriptions, platform configuration, analytics, support).

### B. School Owner / School Administrator

Responsible for managing the institution (school profile, staff, academic sessions, fees, examinations, reports, permissions).

### C. Principal

Responsible for academic and administrative supervision (student performance, attendance monitoring, teacher supervision).

### D. Teacher

Responsible for academic activities (assigned classes, attendance, homework, examination marks, academic notices).

### E. Accountant / Fee Administrator

Responsible for financial operations (fee structures, student invoices, payment collection, receipts, outstanding dues, financial reports).

### F. Student

Self-service academic view (personal details, attendance, examination results, homework, downloads).

### G. Parent / Guardian

Guardian supervision (linked students, attendance tracking, fee payment status, receipts, report cards, school notices).

---

# 5. Product Scope & Phasing

## Phase 1: Core School Management (MVP)

- SaaS authentication and registration
- School onboarding and configuration
- Academic year management
- Class and section management
- User and role management
- Admission management
- Student management
- Attendance management
- Basic fee management
- Student document management
- Dashboard and basic reporting

## Phase 2: Academic and Operational Management

- Examination management
- Marks, grades, and downloadable marksheets/report cards
- Homework management
- Communication management (announcements, notices)
- Student academic history and promotions
- Staff management and advanced reporting

## Phase 3: SaaS Expansion

- Subscription and billing management
- Parent and student self-service portals
- Online payment integration (UPI, Razorpay/Cashfree)
- SMS, email, and WhatsApp integrations
- Multi-branch management
- Transport, Library, and Payroll modules
- Mobile applications

---

# 6. Functional Requirements

## 6.1 SaaS Authentication and Account Management

- Email and mobile number authentication.
- Email verification and mobile OTP verification.
- Optional email where registration workflow permits (mobile-first for Indian context).
- Secure session management, password resets with expiring tokens.
- Account suspension and reactivation.

## 6.2 School Registration and Onboarding

- Unique school account, tenant slug, and tenant identifier.
- Institutional profile: School name, code, contact, affiliation/board (CBSE, ICSE, State Board), address.
- Initial school administrator creation and contact verification.
- Logo upload, initial academic session, classes, and sections configuration.
- Resumable onboarding progress indicator.

## 6.3 School Dashboard

- School-specific KPIs: Total students, active students, staff, today's attendance, fees collected, outstanding dues, recent admissions.
- Role-scoped widgets and drill-downs.

## 6.4 Academic Year Management

- Academic sessions with start/end dates.
- Designation of single active session per school.
- Session archiving with read-only preservation of historical data.

## 6.5 Class and Section Management

- Configurable classes/standards (e.g., Nursery through Class XII).
- Sections per class (A, B, C...).
- Class teacher and subject assignments.

## 6.6 Admission Management

- Lifecycle: Enquiry -> Application Started -> Submitted -> Under Review -> Approved / Rejected -> Enrolled / Withdrawn.
- Configurable admission number generation.
- Conversion of approved application to student record without duplicate data entry.

## 6.7 Student Management

- Complete profile: Admission number, personal details, gender, DOB, blood group, address, guardian details, class/section.
- Tabs: Overview, Academic, Attendance, Fees, Documents, Communication, Activities/Homework, History.
- Promotion, section transfer, withdrawal, and graduation workflows.

## 6.8 Attendance Management

- Daily class/section attendance.
- Statuses: Present, Absent, Late, Leave.
- Prevention of duplicate daily records per student.
- Monthly summaries, percentage calculations, audit history of corrections.

## 6.9 Fee Management

- Fee categories and class-wise fee structures.
- Student concessions and invoice generation.
- Payment recording (Cash, UPI, Bank Transfer, Cheque, Online).
- Decimal/minor-unit safe arithmetic, receipt generation, partial payment tracking, outstanding dues tracking.
- Controlled reversal/refund transactions (no silent deletions).

## 6.10 Document Management

- Private student documents (photos, birth certificates, transfer certificates, marksheets).
- Authorized, signed, time-limited download URLs; mime-type and size validation.

## 6.11 Examination Management

- Exam types, subjects, maximum/passing marks, grading scales.
- Marks entry (including Absent/Exempted), automatic totals/percentages.
- Published results, report cards, and downloadable marksheets.

## 6.12 Communication Management

- Announcements, class notices, student/parent messages.
- Multi-channel delivery (in-app, email, SMS, WhatsApp).

## 6.13 Homework and Activities

- Teacher assignments by class, section, subject with due dates and attachments.

## 6.14 Student Academic History

- Immutable preservation of past sessions, classes, marks, attendance summaries, and promotion trail.

## 6.15 User and Role Management

- Fine-grained RBAC with module-level and action-level permissions.
- Roles: School Admin, Principal, Vice Principal, Teacher, Accountant, Admission Staff, Receptionist, Librarian, Transport Manager, Parent, Student.

---

# 7. Multi-Tenant Architecture & Data Management

- Server-side tenant resolution from session, never trusting client parameters.
- Base repository scoping and PostgreSQL Row-Level Security (RLS) defense-in-depth.
- Composite unique constraints `(id, school_id)` preventing cross-tenant foreign key references.
- Audit logging of all state-changing operations.
- Decimal-safe monetary calculations.

---

# 8. MVP Definition & Implementation Stages

1. **Stage 1: Foundation**: Auth, Tenant Isolation, School Registration, Onboarding, RBAC.
2. **Stage 2: Core Operations**: Academic Sessions, Classes/Sections, Admissions, Student Records, Attendance.
3. **Stage 3: Financial Operations**: Fee Categories, Structures, Invoices, Payments, Receipts, Dues.
4. **Stage 4: Academic Operations**: Examinations, Marks, Grades, Report Cards, Academic History.
5. **Stage 5: Communication & Engagement**: Announcements, Notifications, Homework, Parent/Student Portals.
6. **Stage 6: Production Readiness**: Full automated test verification, security review, performance audit, deployment.
