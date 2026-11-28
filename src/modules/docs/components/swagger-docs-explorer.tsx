"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  Loader2,
  Play,
  Search,
  Shield,
} from "lucide-react";
import type { OpenApiSpecDocument } from "@/modules/docs/openapi-spec";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface EndpointRow {
  id: string;
  path: string;
  method: "get" | "post" | "patch" | "put" | "delete";
  tag: string;
  summary: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: Record<string, unknown>;
  }>;
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
  security?: Array<Record<string, unknown>>;
}

function methodBadgeCls(method: string): string {
  switch (method.toLowerCase()) {
    case "get":
      return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/70";
    case "post":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/70";
    case "patch":
    case "put":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/70";
    case "delete":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/70";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200";
  }
}

export function SwaggerDocsExplorer({ spec }: { spec: OpenApiSpecDocument }) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>("get:/api/health");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tryBodyById, setTryBodyById] = useState<Record<string, string>>({});
  const [tryQueryById, setTryQueryById] = useState<Record<string, string>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [tryResultById, setTryResultById] = useState<
    Record<string, { status: number; body: string }>
  >({});

  const endpoints = useMemo<EndpointRow[]>(() => {
    const list: EndpointRow[] = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, rawOp] of Object.entries(methods)) {
        const op = rawOp as Record<string, unknown>;
        const opTags = Array.isArray(op.tags) ? (op.tags as string[]) : ["General"];
        list.push({
          id: `${method}:${path}`,
          path,
          method: method as EndpointRow["method"],
          tag: opTags[0] || "General",
          summary: String(op.summary || path),
          description: typeof op.description === "string" ? op.description : undefined,
          parameters: Array.isArray(op.parameters)
            ? (op.parameters as EndpointRow["parameters"])
            : undefined,
          requestBody:
            op.requestBody && typeof op.requestBody === "object"
              ? (op.requestBody as Record<string, unknown>)
              : undefined,
          responses:
            op.responses && typeof op.responses === "object"
              ? (op.responses as Record<string, unknown>)
              : undefined,
          security: Array.isArray(op.security)
            ? (op.security as Array<Record<string, unknown>>)
            : undefined,
        });
      }
    }
    return list;
  }, [spec]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return endpoints.filter((ep) => {
      if (selectedTag !== "ALL" && ep.tag !== selectedTag) return false;
      if (!q) return true;
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.tag.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
      );
    });
  }, [endpoints, search, selectedTag]);

  const grouped = useMemo(() => {
    const map = new Map<string, EndpointRow[]>();
    for (const ep of filtered) {
      const list = map.get(ep.tag) || [];
      list.push(ep);
      map.set(ep.tag, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleCopyCurl = async (ep: EndpointRow) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const qs = tryQueryById[ep.id]?.trim();
    const fullUrl = `${origin}${ep.path}${qs ? `?${qs.replace(/^\?/, "")}` : ""}`;
    const body = tryBodyById[ep.id]?.trim();
    const cmd =
      ep.method === "get"
        ? `curl -sS "${fullUrl}"`
        : `curl -X ${ep.method.toUpperCase()} "${fullUrl}" -H "Content-Type: application/json" -d '${
            body || "{}"
          }'`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedId(ep.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleTryExecute = async (ep: EndpointRow) => {
    setRunningId(ep.id);
    try {
      const qs = tryQueryById[ep.id]?.trim();
      const target = `${ep.path}${qs ? `?${qs.replace(/^\?/, "")}` : ""}`;
      const res = await fetch(target, {
        method: ep.method.toUpperCase(),
        headers:
          ep.method !== "get"
            ? { "Content-Type": "application/json" }
            : undefined,
        body:
          ep.method !== "get"
            ? tryBodyById[ep.id]?.trim() || "{}"
            : undefined,
      });
      const text = await res.text();
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // non-JSON payload (CSV/PDF/text)
      }
      setTryResultById((prev) => ({
        ...prev,
        [ep.id]: { status: res.status, body: formatted },
      }));
    } catch (err) {
      setTryResultById((prev) => ({
        ...prev,
        [ep.id]: {
          status: 0,
          body: err instanceof Error ? err.message : "Network error",
        },
      }));
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFE] text-[#1B1D45] dark:bg-[#090A1A] dark:text-[#DCE1F9]">
      <header className="sticky top-0 z-30 border-b border-[#D6DBF0] bg-white/90 backdrop-blur-md dark:border-[#272B4D] dark:bg-[#0E1026]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo imgClassName="h-7 w-auto" />
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[11px] font-extrabold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <FileCode2 className="h-3 w-3" />
              <span>OpenAPI {spec.openapi}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/api/docs/openapi.json"
              download="scholonix-openapi.json"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
            >
              <Download className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>openapi.json</span>
            </a>
            <Link
              href="/help"
              className="hidden sm:inline-flex items-center rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#9DA6CC]"
            >
              School Guide
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <section className="rounded-[22px] border border-[#D6DBF0] bg-white p-6 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                {spec.info.title}
              </h1>
              <p className="text-sm text-[#4D5072] dark:text-[#9DA6CC]">
                {spec.info.description}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1.5 text-xs">
              <span className="rounded-lg bg-[#EDE7FF] px-2.5 py-1 font-extrabold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                v{spec.info.version} • License: {spec.info.license.name}
              </span>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">
                {endpoints.length} documented operations across {spec.tags.length} modules
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C] dark:text-[#9DA6CC]" />
              <input
                type="search"
                aria-label="Filter API endpoints"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search paths, methods, summaries (e.g. /api/school/students, promote, billing)..."
                className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] pl-9 pr-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            <select
              aria-label="Filter API endpoints by tag"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="ALL">All API Groups ({endpoints.length})</option>
              {spec.tags.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="space-y-6">
          {grouped.map(([tag, rows]) => (
            <section key={tag} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {tag}
                </h2>
                <span className="text-xs font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                  {rows.length} endpoint(s)
                </span>
              </div>

              <div className="space-y-2">
                {rows.map((ep) => {
                  const open = expandedId === ep.id;
                  const result = tryResultById[ep.id];
                  return (
                    <div
                      key={ep.id}
                      className="rounded-2xl border border-[#D6DBF0] bg-white overflow-hidden dark:border-[#272B4D] dark:bg-[#141731]"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(open ? null : ep.id)}
                        className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[#FAF8FE] cursor-pointer dark:hover:bg-[#191E3D]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`rounded-lg border px-2 py-0.5 font-mono text-[11px] font-black uppercase ${methodBadgeCls(
                              ep.method,
                            )}`}
                          >
                            {ep.method}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                            {ep.path}
                          </span>
                          <span className="text-xs text-[#4D5072] truncate dark:text-[#9DA6CC]">
                            {ep.summary}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ep.security && ep.security.length > 0 && (
                            <Shield
                              className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]"
                              aria-label="Authenticated route"
                            />
                          )}
                          {open ? (
                            <ChevronDown className="h-4 w-4 text-[#76799C]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[#76799C]" />
                          )}
                        </div>
                      </button>

                      {open && (
                        <div className="border-t border-[#EEF1FA] bg-[#FAF8FE]/70 p-4 space-y-4 text-xs dark:border-[#232746] dark:bg-[#10142C]">
                          {ep.description && (
                            <p className="text-[#4D5072] dark:text-[#9DA6CC]">
                              {ep.description}
                            </p>
                          )}

                          {ep.parameters && ep.parameters.length > 0 && (
                            <div className="space-y-1.5">
                              <h3 className="text-[11px] font-extrabold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                                Parameters
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {ep.parameters.map((p) => (
                                  <span
                                    key={`${p.in}:${p.name}`}
                                    className="rounded-lg border border-[#D6DBF0] bg-white px-2.5 py-1 font-mono text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                                  >
                                    <strong>{p.name}</strong> ({p.in}
                                    {p.required ? ", required" : ""})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-extrabold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                                Query String (Optional)
                              </label>
                              <input
                                value={tryQueryById[ep.id] || ""}
                                onChange={(e) =>
                                  setTryQueryById((prev) => ({
                                    ...prev,
                                    [ep.id]: e.target.value,
                                  }))
                                }
                                placeholder="e.g. grade=Class%20I&page=1"
                                className="mt-1 w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 font-mono text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                              />
                            </div>

                            {ep.method !== "get" && (
                              <div>
                                <label className="text-[11px] font-extrabold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                                  JSON Request Body
                                </label>
                                <textarea
                                  rows={3}
                                  value={tryBodyById[ep.id] || "{}"}
                                  onChange={(e) =>
                                    setTryBodyById((prev) => ({
                                      ...prev,
                                      [ep.id]: e.target.value,
                                    }))
                                  }
                                  className="mt-1 w-full rounded-xl border border-[#CAD0EB] bg-white p-2.5 font-mono text-[11px] dark:border-[#343B6B] dark:bg-[#141731]"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTryExecute(ep)}
                              disabled={runningId === ep.id}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                            >
                              {runningId === ep.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              <span>Execute Request</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyCurl(ep)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                            >
                              {copiedId === ep.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>{copiedId === ep.id ? "Copied cURL" : "Copy cURL"}</span>
                            </button>
                          </div>

                          {result && (
                            <div className="space-y-1">
                              <p className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                                Response Status:{" "}
                                <span
                                  className={
                                    result.status >= 200 && result.status < 300
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-rose-600 dark:text-rose-400"
                                  }
                                >
                                  HTTP {result.status}
                                </span>
                              </p>
                              <pre className="max-h-64 overflow-auto rounded-xl border border-[#D6DBF0] bg-white p-3 font-mono text-[11px] text-[#08093B] dark:border-[#272B4D] dark:bg-[#090A1A] dark:text-[#DCE1F9]">
                                {result.body}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
