---
name: timetable
description: Create conflict-aware class, teacher, room, and period scheduling.
---

# Timetable Skill

## Workflow
1. Define school days, periods, breaks, rooms, teacher availability, class sections, and subject requirements.
2. Define hard constraints (no teacher/class/room overlap) and soft preferences.
3. Validate all assignments server-side and report conflicts clearly.
4. Support draft, publish, and revision states.
5. Preserve historical timetable versions and communicate changes.
6. Consider substitute-teacher and one-off schedule exceptions separately.

## Deliverables
Constraint model, conflict detection rules, API contract, and tests for overlapping assignments.
