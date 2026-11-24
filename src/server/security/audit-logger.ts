import "server-only";
import { logger } from "@/lib/logger";

export interface AuditEventPayload {
  schoolId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Emits an immutable, structured audit log entry for security and regulatory compliance.
 * Tenant-scoped actions and auth events call this.
 */
export async function logAuditEvent(payload: AuditEventPayload): Promise<void> {
  const {
    schoolId = "system",
    actorId = "anonymous",
    action,
    entityType,
    entityId = "system",
    details,
    ipAddress,
    userAgent,
  } = payload;

  try {
    logger.info(
      {
        audit: true,
        schoolId,
        actorId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      },
      `[AUDIT] ${action} on ${entityType}:${entityId} by actor ${actorId}`,
    );
  } catch {
    console.info(`[AUDIT] ${action} on ${entityType}:${entityId} by actor ${actorId}`);
  }
}
