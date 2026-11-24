---
name: file-storage-import-export
description: Handle secure documents, bulk imports, exports, and generated reports.
---

# File Storage, Import, and Export Skill

## Security
- Store private student/staff documents in private buckets with short-lived signed access.
- Enforce tenant-scoped object paths and server-side ownership checks.
- Validate file size, extension, MIME, content signature, and safe filename handling.
- Never trust a client-provided storage path.

## Imports
- Provide template, preview, row-level validation, duplicate detection, error report, and explicit commit.
- Use background jobs for large imports and make them resumable/idempotent.
- Preserve source file reference and import audit trail.

## Exports
- Re-check permission and tenant scope at execution time.
- Limit columns and rows to authorized data.
- Protect generated files with expiry and access controls.
