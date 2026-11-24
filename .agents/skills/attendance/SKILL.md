---
name: attendance
description: Implement student and staff attendance with correction and reporting workflows.
---

# Attendance Management Skill

## Rules
- Define attendance statuses and whether half-day, late, excused, leave, and holidays are supported.
- Store date in the school's configured timezone and define the canonical attendance date.
- Enforce uniqueness for person + school + attendance session/date + relevant period.
- Support bulk marking with preview, validation, and atomic save.
- Track who marked or corrected attendance and why.
- Prevent silent overwrite; use correction history or audit records.
- Handle timetable/period attendance separately from daily attendance if required.

## Tests
Duplicate marking, concurrent edits, holiday rules, timezone boundaries, bulk partial failures, and permission restrictions.
