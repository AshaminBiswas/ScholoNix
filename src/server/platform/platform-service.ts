import "server-only";
import { admissionsRepository } from "@/server/school/admissions-repository";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformRepository } from "./platform-repository";
import type { PlatformOverviewPeriodDays } from "@/modules/platform/types";
import type {
  CreateAnnouncementInput,
  CreatePlatformInvoiceInput,
  CreatePlatformSchoolUserInput,
  PlatformSchoolDataPatchInput,
  ProvisionSchoolInput,
  UpdateAnnouncementInput,
  UpdatePlatformInvoiceInput,
  UpdatePlatformSchoolInput,
  UpdatePlatformSchoolUserInput,
  UpdateSupportTicketInput,
} from "@/modules/platform/schemas";

interface ActorContext {
  id: string;
  name: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
}

export const platformService = {
  async getOverview(periodDays: PlatformOverviewPeriodDays = 30) {
    return platformRepository.getOverview(periodDays);
  },

  async listSchools(params?: { q?: string; status?: string; plan?: string }) {
    return platformRepository.listSchools(params);
  },

  async provisionSchool(actor: ActorContext, input: ProvisionSchoolInput) {
    const entry = await platformRepository.provisionSchool(actor.id, input);
    await logAuditEvent({
      schoolId: entry.school.id,
      actorId: actor.id,
      action: "PLATFORM_SCHOOL_PROVISIONED",
      entityType: "School",
      entityId: entry.school.id,
      details: {
        name: entry.school.name,
        uniqueId: entry.school.uniqueId,
        plan: entry.school.plan,
        status: entry.school.status,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return entry;
  },

  async updateSchool(
    actor: ActorContext,
    schoolId: string,
    input: UpdatePlatformSchoolInput,
  ) {
    const updated = await platformRepository.updateSchool(schoolId, input);
    await logAuditEvent({
      schoolId,
      actorId: actor.id,
      action: "PLATFORM_SCHOOL_UPDATED",
      entityType: "School",
      entityId: schoolId,
      details: {
        status: updated.status,
        plan: updated.plan,
        subscriptionStatus: updated.subscriptionStatus,
        fields: Object.keys(input),
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return updated;
  },

  async deleteSchool(actor: ActorContext, schoolId: string) {
    await platformRepository.deleteSchool(schoolId);
    await logAuditEvent({
      schoolId,
      actorId: actor.id,
      action: "PLATFORM_SCHOOL_DELETED",
      entityType: "School",
      entityId: schoolId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  },

  async listSchoolUsers(schoolId: string) {
    return platformRepository.listSchoolUsers(schoolId);
  },

  async createSchoolUser(
    actor: ActorContext,
    schoolId: string,
    input: CreatePlatformSchoolUserInput,
  ) {
    const created = await platformRepository.createSchoolUser(schoolId, input);
    await logAuditEvent({
      schoolId,
      actorId: actor.id,
      action: "PLATFORM_SCHOOL_USER_CREATED",
      entityType: "User",
      entityId: created.id,
      details: { role: created.role, status: created.status },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return created;
  },

  async updateSchoolUser(
    actor: ActorContext,
    schoolId: string,
    userId: string,
    input: UpdatePlatformSchoolUserInput,
  ) {
    const updated = await platformRepository.updateSchoolUser(schoolId, userId, input);
    await logAuditEvent({
      schoolId,
      actorId: actor.id,
      action: "PLATFORM_SCHOOL_USER_UPDATED",
      entityType: "User",
      entityId: userId,
      details: {
        role: updated.role,
        status: updated.status,
        revokedSessions: Boolean(input.revokeSessions),
        passwordReset: Boolean(input.newPassword),
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return updated;
  },

  async listGlobalUsers(params?: { q?: string; role?: string; status?: string }) {
    return platformRepository.listGlobalUsers(params);
  },

  async revokeUserSessions(actor: ActorContext, userId: string) {
    await platformRepository.revokeUserSessions(userId);
    await logAuditEvent({
      schoolId: "platform",
      actorId: actor.id,
      action: "PLATFORM_USER_SESSIONS_REVOKED",
      entityType: "User",
      entityId: userId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  },

  async inspectSchoolData(actor: ActorContext, schoolId: string) {
    const data = await platformRepository.inspectSchoolData(schoolId);
    await logAuditEvent({
      schoolId,
      actorId: actor.id,
      action: "PLATFORM_SCHOOL_DATA_INSPECTED",
      entityType: "School",
      entityId: schoolId,
      details: {
        applications: data.applications.length,
        enquiries: data.enquiries.length,
        feeLedgers: data.feeLedgers.length,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return data;
  },

  async patchSchoolData(
    actor: ActorContext,
    schoolId: string,
    input: PlatformSchoolDataPatchInput,
  ) {
    const actorMeta = { id: actor.id, name: `${actor.name} (Platform Admin)`, role: actor.role };
    if (input.action === "update_admission_settings") {
      const updatedSettings = await admissionsRepository.updateSettings(
        schoolId,
        actorMeta,
        input.settings,
      );
      await logAuditEvent({
        schoolId,
        actorId: actor.id,
        action: "PLATFORM_TENANT_SETTINGS_UPDATED",
        entityType: "AdmissionSetting",
        entityId: schoolId,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
      return { settings: updatedSettings };
    }
    if (input.action === "update_application_status") {
      const result = await admissionsRepository.updateApplication(
        schoolId,
        input.applicationId,
        actorMeta,
        { status: input.status },
      );
      await logAuditEvent({
        schoolId,
        actorId: actor.id,
        action: "PLATFORM_TENANT_APPLICATION_UPDATED",
        entityType: "AdmissionApplication",
        entityId: input.applicationId,
        details: { status: input.status },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
      return { application: result.after };
    }

    const result = await admissionsRepository.updateOrConvertEnquiry(
      schoolId,
      input.enquiryId,
      actorMeta,
      { action: "update", status: input.status },
    );
    await logAuditEvent({
      schoolId,
      actorId: actor.id,
      action: "PLATFORM_TENANT_ENQUIRY_UPDATED",
      entityType: "AdmissionEnquiry",
      entityId: input.enquiryId,
      details: { status: input.status },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return { enquiry: result.enquiry };
  },

  async listInvoices(filters?: { schoolId?: string; status?: string }) {
    return platformRepository.listInvoices(filters);
  },

  async createInvoice(actor: ActorContext, input: CreatePlatformInvoiceInput) {
    const invoice = await platformRepository.createInvoice(actor.id, input);
    await logAuditEvent({
      schoolId: input.schoolId,
      actorId: actor.id,
      action: "PLATFORM_SAAS_INVOICE_CREATED",
      entityType: "PlatformSubscriptionInvoice",
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        amountPaise: invoice.amountPaise,
        status: invoice.status,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return invoice;
  },

  async updateInvoice(actor: ActorContext, input: UpdatePlatformInvoiceInput) {
    const updated = await platformRepository.updateInvoice(input);
    await logAuditEvent({
      schoolId: updated.schoolId,
      actorId: actor.id,
      action: "PLATFORM_SAAS_INVOICE_UPDATED",
      entityType: "PlatformSubscriptionInvoice",
      entityId: updated.id,
      details: { status: updated.status },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return updated;
  },

  async listSupportTickets(status?: string) {
    return platformRepository.listSupportTickets(status);
  },

  async updateSupportTicket(actor: ActorContext, input: UpdateSupportTicketInput) {
    const updated = await platformRepository.updateSupportTicket(actor.id, input);
    await logAuditEvent({
      schoolId: updated.schoolId || "platform",
      actorId: actor.id,
      action: "PLATFORM_SUPPORT_TICKET_UPDATED",
      entityType: "PlatformSupportTicket",
      entityId: updated.id,
      details: { status: updated.status, priority: updated.priority },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return updated;
  },

  async listAuditLogs(params?: { schoolId?: string; q?: string }) {
    return platformRepository.listAuditLogs(params);
  },

  async listAnnouncements() {
    return platformRepository.listAnnouncements();
  },

  async createAnnouncement(actor: ActorContext, input: CreateAnnouncementInput) {
    const created = await platformRepository.createAnnouncement(actor.id, input);
    await logAuditEvent({
      schoolId: input.targetSchoolId || "platform",
      actorId: actor.id,
      action: "PLATFORM_ANNOUNCEMENT_CREATED",
      entityType: "PlatformAnnouncement",
      entityId: created.id,
      details: { title: created.title, severity: created.severity },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return created;
  },

  async updateAnnouncement(actor: ActorContext, input: UpdateAnnouncementInput) {
    const updated = await platformRepository.updateAnnouncement(input);
    await logAuditEvent({
      schoolId: updated.targetSchoolId || "platform",
      actorId: actor.id,
      action: "PLATFORM_ANNOUNCEMENT_UPDATED",
      entityType: "PlatformAnnouncement",
      entityId: updated.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return updated;
  },

  async deleteAnnouncement(actor: ActorContext, id: string) {
    await platformRepository.deleteAnnouncement(id);
    await logAuditEvent({
      schoolId: "platform",
      actorId: actor.id,
      action: "PLATFORM_ANNOUNCEMENT_DELETED",
      entityType: "PlatformAnnouncement",
      entityId: id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  },

  async getHealthSnapshot() {
    return platformRepository.getHealthSnapshot();
  },
};
