import "server-only";
import { logger } from "@/lib/logger";
import { db } from "@/server/database/client";

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

export interface InMemoryAuditEntry {
  id: string;
  schoolId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const auditRingBuffer: InMemoryAuditEntry[] = [];

export function getRecentInMemoryAuditEntries(): InMemoryAuditEntry[] {
  return [...auditRingBuffer];
}

/**
 * Emits an immutable, structured audit log entry for security and regulatory compliance.
 * Logs via Pino and best-effort persists into PostgreSQL `audit_logs` (plus test memory ring buffer).
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

  const timestamp = new Date().toISOString();

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
        timestamp,
      },
      `[AUDIT] ${action} on ${entityType}:${entityId} by actor ${actorId}`,
    );
  } catch {
    console.info(`[AUDIT] ${action} on ${entityType}:${entityId} by actor ${actorId}`);
  }

  const scopedSchoolId = UUID_PATTERN.test(schoolId) ? schoolId : null;
  const scopedActorId = UUID_PATTERN.test(actorId) ? actorId : null;

  auditRingBuffer.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    schoolId: scopedSchoolId,
    actorId: scopedActorId,
    action,
    entityType,
    entityId,
    metadata: details ?? null,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    createdAt: timestamp,
  });
  if (auditRingBuffer.length > 250) {
    auditRingBuffer.length = 250;
  }

  if (process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL?.trim())) {
    try {
      await db.auditLog.create({
        data: {
          schoolId: scopedSchoolId,
          actorId: scopedActorId,
          action: action.slice(0, 100),
          entityType: entityType.slice(0, 100),
          entityId: entityId.slice(0, 255),
          metadata: (details ?? undefined) as never,
          ipAddress: ipAddress?.slice(0, 45) ?? null,
          userAgent: userAgent ?? null,
        },
      });
    } catch {
      // Never break primary operations if audit persistence experiences transient DB lag
    }
  }
}
