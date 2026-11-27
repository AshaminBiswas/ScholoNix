"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Download,
  Lock,
  Megaphone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  SAAS_PLAN_CATALOG,
  type PlatformAnnouncementRecord,
  type PlatformAnnouncementSeverityValue,
  type PlatformAuditLogRecord,
  type PlatformHealthSnapshot,
  type PlatformInvoiceRecord,
  type PlatformSchoolEntry,
  type PlatformSchoolUserItem,
  type PlatformSupportTicketRecord,
  type SaaSBillingCycleValue,
  type SaaSPlanValue,
} from "@/modules/platform/types";
import {
  InvoiceStatusBadge,
  PlanBadge,
  TicketStatusBadge,
  exportRowsToCsv,
  formatDateShort,
  formatDateTime,
  formatInrFromPaise,
} from "./platform-shared";

/* ============================================================================
 * 1. GLOBAL USERS & SESSIONS TAB
 * ========================================================================== */
export function PlatformUsersTab({
  onToast,
}: {
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [users, setUsers] = useState<PlatformSchoolUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async (query = q, roleFilter = role) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (roleFilter !== "ALL") qs.set("role", roleFilter);
      const res = await fetch(`/api/platform/users?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setUsers(json.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers("", "ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevoke = async (userId: string, name: string) => {
    const res = await fetch("/api/platform/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      onToast("error", json?.error?.message || "Failed to revoke sessions.");
      return;
    }
    onToast("success", `Revoked all active sessions for ${name}.`);
    void loadUsers();
  };

  return (
    <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Global Users &amp; Active Sessions
          </h2>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Search any user across all registered schools and revoke compromised sessions immediately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadUsers(q, role);
              }}
              placeholder="Name, email, phone..."
              className="rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] pl-8 pr-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
            />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              void loadUsers(q, e.target.value);
            }}
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            <option value="ALL">All Roles</option>
            <option value="PLATFORM_SUPER_ADMIN">Super Admin</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="SCHOOL_ADMIN">School Admin</option>
            <option value="TEACHER">Teacher</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="STAFF">Staff</option>
            <option value="PARENT">Parent</option>
            <option value="STUDENT">Student</option>
          </select>
          <button
            type="button"
            onClick={() => void loadUsers(q, role)}
            className="rounded-[10px] bg-[#663CF6] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
          >
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-xs text-[#76799C]">Loading platform users...</p>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-center">Active Sessions</th>
                <th className="px-3 py-2 text-right">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2">
                    <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{u.name}</p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      {u.email || "—"} · {u.phone || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{u.schoolName || "Platform"}</p>
                    {u.schoolUniqueId && (
                      <p className="font-mono text-[10px] text-[#663CF6] dark:text-[#A78BFA]">
                        {u.schoolUniqueId}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 font-bold">{u.role}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2 text-center font-bold">{u.activeSessionCount ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void handleRevoke(u.id, u.name)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#CAD0EB] px-2.5 py-1 text-[11px] font-bold hover:border-rose-500 hover:text-rose-600 cursor-pointer dark:border-[#343B6B]"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Revoke Sessions</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ============================================================================
 * 2. SAAS PLANS & BILLING TAB
 * ========================================================================== */
export function PlatformBillingTab({
  schools,
  onToast,
}: {
  schools: PlatformSchoolEntry[];
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [invoices, setInvoices] = useState<PlatformInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState(schools[0]?.school.id || "");
  const [plan, setPlan] = useState<SaaSPlanValue>("STARTER");
  const [billingCycle, setBillingCycle] = useState<SaaSBillingCycleValue>("MONTHLY");
  const [amountRupees, setAmountRupees] = useState("1999");
  const [status, setStatus] = useState<"PENDING" | "PAID">("PAID");
  const [paymentMode, setPaymentMode] = useState("UPI / Bank Transfer");
  const [reference, setReference] = useState("");
  const [creating, setCreating] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/billing", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setInvoices(json.invoices || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setCreating(true);
    try {
      const now = new Date();
      const end = new Date(
        now.getTime() + (billingCycle === "YEARLY" ? 365 : 30) * 86_400_000,
      );
      const res = await fetch("/api/platform/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          idempotencyKey: `saas-inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          plan,
          billingCycle,
          amountRupees: Number(amountRupees),
          periodStart: now.toISOString(),
          periodEnd: end.toISOString(),
          status,
          paymentMode,
          paymentReference: reference,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to generate SaaS invoice.");
      }
      setReference("");
      onToast("success", `Invoice ${json.invoice.invoiceNumber} created.`);
      await loadInvoices();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Invoice creation failed.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, nextStatus: "PAID" | "VOID") => {
    const res = await fetch("/api/platform/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, status: nextStatus }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      onToast("error", json?.error?.message || "Failed to update invoice.");
      return;
    }
    onToast("success", `Invoice marked ${nextStatus}.`);
    await loadInvoices();
  };

  return (
    <div className="space-y-5">
      {/* Create SaaS Invoice */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              SaaS Subscriptions &amp; Company Billing
            </h2>
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Generate idempotent subscription invoices and track school payments in exact minor units.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportRowsToCsv(
                "scholonix-saas-invoices.csv",
                ["Invoice No", "School", "Plan", "Cycle", "Amount (INR)", "Status", "Period End"],
                invoices.map((i) => [
                  i.invoiceNumber,
                  i.schoolName,
                  i.plan,
                  i.billingCycle,
                  (i.amountPaise / 100).toFixed(2),
                  i.status,
                  formatDateShort(i.periodEnd),
                ]),
              )
            }
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] px-3 py-1.5 text-xs font-bold cursor-pointer dark:border-[#343B6B]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Revenue CSV</span>
          </button>
        </div>

        <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 pt-2">
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            aria-label="Target school for invoice"
            className="sm:col-span-2 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            {schools.map((s) => (
              <option key={s.school.id} value={s.school.id}>
                {s.school.name} ({s.school.uniqueId || s.school.slug})
              </option>
            ))}
          </select>
          <select
            value={plan}
            onChange={(e) => {
              const nextP = e.target.value as SaaSPlanValue;
              setPlan(nextP);
              const cat = SAAS_PLAN_CATALOG[nextP];
              setAmountRupees(
                String(
                  (billingCycle === "YEARLY" ? cat.yearlyTotalPaise : cat.monthlyPaise) / 100,
                ),
              );
            }}
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select
            value={billingCycle}
            onChange={(e) => {
              const nextC = e.target.value as SaaSBillingCycleValue;
              setBillingCycle(nextC);
              const cat = SAAS_PLAN_CATALOG[plan];
              setAmountRupees(
                String((nextC === "YEARLY" ? cat.yearlyTotalPaise : cat.monthlyPaise) / 100),
              );
            }}
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            placeholder="Amount ₹"
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
          />
          <button
            type="submit"
            disabled={creating || !schoolId}
            className="inline-flex items-center justify-center gap-1 rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{creating ? "Creating..." : "Create Invoice"}</span>
          </button>
          <div className="sm:col-span-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "PENDING" | "PAID")}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
            >
              <option value="PAID">Mark Paid Immediately</option>
              <option value="PENDING">Pending Collection</option>
            </select>
          </div>
          <input
            type="text"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            placeholder="Payment Mode"
            className="sm:col-span-2 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="UTR / Reference ID"
            className="sm:col-span-2 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
        </form>
      </section>

      {/* Invoices List */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        {loading ? (
          <p className="py-6 text-center text-xs text-[#76799C]">Loading SaaS invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#76799C]">
            No SaaS subscription invoices issued yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Period End</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-3 py-2 font-mono font-bold">{inv.invoiceNumber}</td>
                    <td className="px-3 py-2 font-bold">{inv.schoolName}</td>
                    <td className="px-3 py-2">
                      <PlanBadge plan={inv.plan} />
                    </td>
                    <td className="px-3 py-2 text-right font-extrabold">
                      {formatInrFromPaise(inv.amountPaise)}
                    </td>
                    <td className="px-3 py-2">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-3 py-2">{formatDateShort(inv.periodEnd)}</td>
                    <td className="px-3 py-2 text-right space-x-1.5">
                      {inv.status !== "PAID" && inv.status !== "VOID" && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateInvoiceStatus(inv.id, "PAID")}
                          className="rounded border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-700 cursor-pointer dark:border-emerald-800 dark:text-emerald-300"
                        >
                          Mark Paid
                        </button>
                      )}
                      {inv.status !== "VOID" && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateInvoiceStatus(inv.id, "VOID")}
                          className="rounded border border-[#CAD0EB] px-2 py-0.5 text-[10px] font-bold text-[#76799C] cursor-pointer dark:border-[#343B6B]"
                        >
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================================
 * 3. SUPPORT, CONTACT & FEEDBACK INBOX TAB
 * ========================================================================== */
export function PlatformSupportTab({
  onToast,
}: {
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [tickets, setTickets] = useState<PlatformSupportTicketRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadTickets = async (st = statusFilter) => {
    setLoading(true);
    try {
      const qs = st !== "ALL" ? `?status=${encodeURIComponent(st)}` : "";
      const res = await fetch(`/api/platform/support${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setTickets(json.tickets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets("ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = async (
    ticketId: string,
    payload: { status?: string; priority?: string; resolutionNotes?: string },
  ) => {
    const res = await fetch("/api/platform/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, ...payload }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      onToast("error", json?.error?.message || "Failed to update ticket.");
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? json.ticket : t)));
    onToast("success", "Ticket updated.");
  };

  return (
    <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Support, Contact &amp; Feedback Inbox
          </h2>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Incoming Contact inquiries, product ratings &amp; feedback submissions, and school support requests.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            void loadTickets(e.target.value);
          }}
          className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
        >
          <option value="ALL">All Tickets</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-[#76799C]">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="py-8 text-center text-xs text-[#76799C]">
          No support tickets or contact/feedback submissions in this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-2 dark:border-[#272B4D] dark:bg-[#10142C]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                      {t.referenceCode}
                    </span>
                    <TicketStatusBadge status={t.status} />
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {t.source.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    {t.subject}
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    From: {t.senderName} ({t.senderEmail || t.senderPhone || "No contact"}) ·{" "}
                    {t.schoolName || "General"} · {formatDateTime(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Status for ${t.referenceCode}`}
                    value={t.status}
                    onChange={(e) => void handleUpdate(t.id, { status: e.target.value })}
                    className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-xs font-bold dark:border-[#343B6B] dark:bg-[#141731]"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-[#1B1D45] dark:text-[#DCE1F9] whitespace-pre-wrap">
                {t.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================================
 * 4. SECURITY AUDIT LOGS & SYSTEM HEALTH TAB
 * ========================================================================== */
export function PlatformAuditHealthTab() {
  const [logs, setLogs] = useState<PlatformAuditLogRecord[]>([]);
  const [health, setHealth] = useState<PlatformHealthSnapshot | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async (query = q) => {
    setLoading(true);
    try {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const res = await fetch(`/api/platform/audit-logs${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
        setHealth(json.health || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      {health && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-4 dark:border-[#272B4D] dark:bg-[#141731]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">PostgreSQL Pool</p>
            <p className="mt-1 text-base font-extrabold flex items-center gap-1.5">
              <CheckCircle2
                className={`h-4 w-4 ${health.databaseConnected ? "text-emerald-500" : "text-amber-500"}`}
              />
              <span>
                {health.databaseConnected ? `Connected (${health.dbLatencyMs}ms)` : "Memory Fallback"}
              </span>
            </p>
          </div>
          <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-4 dark:border-[#272B4D] dark:bg-[#141731]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Upstash Redis</p>
            <p className="mt-1 text-base font-extrabold">
              {health.redisConfigured ? "Configured" : "In-Memory Cache"}
            </p>
          </div>
          <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-4 dark:border-[#272B4D] dark:bg-[#141731]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Platform Tables</p>
            <p className="mt-1 text-base font-extrabold">
              {health.platformSchemaProvisioned ? "Provisioned" : "Pending SQL Migration"}
            </p>
          </div>
          <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-4 dark:border-[#272B4D] dark:bg-[#141731]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Admissions &amp; Fees Schema</p>
            <p className="mt-1 text-base font-extrabold">
              {health.admissionsSchemaProvisioned ? "Provisioned" : "Partial"}
            </p>
          </div>
        </section>
      )}

      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#663CF6]" />
            <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Immutable Security &amp; Governance Audit Logs
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadData(q);
              }}
              placeholder="Filter action or entity..."
              className="rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
            />
            <button
              type="button"
              onClick={() => void loadData(q)}
              className="rounded-[10px] bg-[#663CF6] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-6 text-center text-xs text-[#76799C]">Loading audit trail...</p>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                      {log.action}
                    </td>
                    <td className="px-3 py-2">{log.schoolName || "Platform"}</td>
                    <td className="px-3 py-2">{log.actorName || log.actorId || "System"}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {log.entityType}:{log.entityId.slice(0, 18)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================================
 * 5. GLOBAL ANNOUNCEMENTS TAB
 * ========================================================================== */
export function PlatformAnnouncementsTab({
  schools,
  onToast,
}: {
  schools: PlatformSchoolEntry[];
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncementRecord[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<PlatformAnnouncementSeverityValue>("INFO");
  const [targetPlan, setTargetPlan] = useState<string>("");
  const [targetSchoolId, setTargetSchoolId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const loadList = async () => {
    try {
      const res = await fetch("/api/platform/announcements", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setAnnouncements(json.announcements || []);
    } catch {
      // keep current state on transient failure
    }
  };

  useEffect(() => {
    void loadList();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/platform/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          severity,
          targetPlan: targetPlan || null,
          targetSchoolId: targetSchoolId || null,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to publish announcement.");
      }
      setTitle("");
      setMessage("");
      onToast("success", "Announcement published.");
      await loadList();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Failed to publish.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (item: PlatformAnnouncementRecord) => {
    await fetch("/api/platform/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: item.id, isActive: !item.isActive }),
    });
    await loadList();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/platform/announcements?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadList();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#663CF6]" />
          <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Platform Announcements &amp; Maintenance Notices
          </h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="sm:col-span-2 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as PlatformAnnouncementSeverityValue)}
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            <option value="INFO">Info / Release Update</option>
            <option value="WARNING">Billing / Policy Notice</option>
            <option value="MAINTENANCE">Scheduled Maintenance</option>
          </select>
          <textarea
            rows={2}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Broadcast message to schools..."
            className="sm:col-span-3 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
          <select
            value={targetPlan}
            onChange={(e) => setTargetPlan(e.target.value)}
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            <option value="">All SaaS Plans</option>
            <option value="STARTER">Starter Only</option>
            <option value="PROFESSIONAL">Professional Only</option>
            <option value="ENTERPRISE">Enterprise Only</option>
          </select>
          <select
            value={targetSchoolId}
            onChange={(e) => setTargetSchoolId(e.target.value)}
            className="rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
          >
            <option value="">All Schools</option>
            {schools.map((s) => (
              <option key={s.school.id} value={s.school.id}>
                {s.school.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
          >
            {creating ? "Publishing..." : "Publish Announcement"}
          </button>
        </form>
      </section>

      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
        {announcements.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#76799C]">
            No active platform announcements.
          </p>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    {a.severity}
                  </span>
                  <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">{a.title}</p>
                </div>
                <p className="mt-1 text-xs text-[#4D5072] dark:text-[#C5CCF0]">{a.message}</p>
                <p className="mt-1 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                  Scope: {a.targetSchoolName || a.targetPlan || "Global (All Schools)"} ·{" "}
                  {a.isActive ? "Active" : "Paused"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleToggle(a)}
                  className="rounded-lg border border-[#CAD0EB] px-2.5 py-1 text-[11px] font-bold cursor-pointer dark:border-[#343B6B]"
                >
                  {a.isActive ? "Pause" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(a.id)}
                  aria-label={`Delete announcement ${a.title}`}
                  className="rounded-lg p-1.5 text-[#76799C] hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
