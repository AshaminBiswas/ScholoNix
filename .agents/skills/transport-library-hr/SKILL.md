---
name: transport-library-hr
description: Design optional school operations modules such as transport, library, and HR.
---

# School Operations Modules Skill

## Transport
Model routes, stops, vehicles, drivers, attendants, student assignments, capacity, route status, and emergency contacts. Validate capacity and preserve assignment history.

## Library
Model catalog items, physical copies, accession identifiers, borrowers, loans, returns, renewals, reservations, fines, and lost/damaged workflows. Enforce copy availability transactionally.

## HR and payroll
Separate staff profile, employment, attendance, leave, salary structure, payroll period, payroll run, payslip, and adjustment. Snapshot payroll inputs and require approval before posting.

## General
Keep modules independently permissioned and tenant-scoped. Avoid coupling optional modules to core admission/academic flows.
