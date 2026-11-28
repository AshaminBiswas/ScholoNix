"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  FileText,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  DEFAULT_PROMOTION_SETTINGS_SUITE,
  type PromotionSettingsConfig,
  type PromotionSettingsSubTab,
  type PromotionSettingsSuiteConfig,
  type PromotionSuiteTab,
  type StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import { SettingsGeneralTab } from "@/modules/students/components/promotions/settings/settings-general-tab";
import { SettingsAcademicDefaultsTab } from "@/modules/students/components/promotions/settings/settings-academic-defaults-tab";
import {
  SettingsAutomationTab,
  SettingsNotificationsTab,
} from "@/modules/students/components/promotions/settings/settings-automation-notifications-tabs";
import {
  SettingsAccessPermissionsTab,
  SettingsAuditLogsTab,
} from "@/modules/students/components/promotions/settings/settings-access-audit-tabs";

const SETTINGS_SUB_TABS: Array<{
  id: PromotionSettingsSubTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "general", label: "General Settings", icon: <Settings className="h-3.5 w-3.5" /> },
  { id: "academic", label: "Academic Defaults", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "automation", label: "Automation", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-3.5 w-3.5" /> },
  { id: "access", label: "Access & Permissions", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: "audit", label: "Audit & Logs", icon: <FileText className="h-3.5 w-3.5" /> },
];

export function PromotionSettingsSuite({
  mode,
  schoolId,
  data,
  academicYear,
  canManageSettings,
  saving,
  onSaveAll,
  onSwitchSuiteTab,
  onReloadOverview,
  onDownloadReport,
  onNotifyFeedback,
}: {
  mode: "school" | "platform";
  schoolId: string;
  data: StudentPromotionOverviewData;
  academicYear: string;
  canManageSettings: boolean;
  saving: boolean;
  onSaveAll: (payload: {
    academicYear: string;
    settings: PromotionSettingsConfig;
    settingsSuite: PromotionSettingsSuiteConfig;
  }) => Promise<void>;
  onSwitchSuiteTab: (tab: PromotionSuiteTab) => void;
  onReloadOverview: () => Promise<void>;
  onDownloadReport: () => void;
  onNotifyFeedback: (msg: { type: "ok" | "err"; message: string }) => void;
}) {
  const [subTab, setSubTab] = useState<PromotionSettingsSubTab>("general");
  const [settings, setSettings] = useState<PromotionSettingsConfig>(data.settings);
  const [suite, setSuite] = useState<PromotionSettingsSuiteConfig>(
    data.settingsSuite ?? DEFAULT_PROMOTION_SETTINGS_SUITE,
  );

  useEffect(() => {
    setSettings(data.settings);
    setSuite(data.settingsSuite ?? DEFAULT_PROMOTION_SETTINGS_SUITE);
  }, [data]);

  const handleSave = async () => {
    await onSaveAll({ academicYear, settings, settingsSuite: suite });
  };

  const handleResetDefaults = () => {
    setSuite(
      JSON.parse(JSON.stringify(DEFAULT_PROMOTION_SETTINGS_SUITE)) as PromotionSettingsSuiteConfig,
    );
    onNotifyFeedback({
      type: "ok",
      message: "Restored default values locally. Click Save to apply.",
    });
  };

  const handleTestNotification = async (templateName: string, channel: string) => {
    const endpoint =
      mode === "platform"
        ? `/api/platform/schools/${schoolId}/promotions`
        : `/api/school/students/promotions/notifications/test`;
    const body =
      mode === "platform"
        ? { action: "testNotification", templateName, channel }
        : { templateName, channel };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      onNotifyFeedback({ type: "err", message: json.error || "Failed to dispatch test alert" });
      return;
    }
    onNotifyFeedback({
      type: "ok",
      message: json.result?.message || `Test ${channel} notification logged.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
          Promotion Settings
        </h3>
      </div>

      {/* 6 Nested Pill Sub-Tabs matching design screenshots */}
      <nav
        aria-label="Promotion settings sub-sections"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/85 bg-white/75 p-1.5 backdrop-blur-md shadow-[0_6px_18px_rgba(79,39,232,0.05)] dark:border-[#272B4D] dark:bg-[#141731]/90"
      >
        {SETTINGS_SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`h-8 inline-flex items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-sm"
                  : "text-[#4D5072] hover:bg-[#F1EFFD] hover:text-[#4F27E8] dark:text-[#B4BDD9] dark:hover:bg-[#1F244A]"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {subTab === "general" && (
        <SettingsGeneralTab
          data={data}
          academicYear={academicYear}
          settings={settings}
          general={suite.general}
          canManageSettings={canManageSettings}
          saving={saving}
          onSettingsChange={(p) => setSettings((prev) => ({ ...prev, ...p }))}
          onGeneralChange={(p) =>
            setSuite((prev) => ({ ...prev, general: { ...prev.general, ...p } }))
          }
          onSwitchSuiteTab={onSwitchSuiteTab}
          onReset={handleResetDefaults}
          onSave={handleSave}
        />
      )}

      {subTab === "academic" && (
        <SettingsAcademicDefaultsTab
          data={data}
          academicYear={academicYear}
          settings={settings}
          academicDefaults={suite.academicDefaults}
          canManageSettings={canManageSettings}
          saving={saving}
          onSettingsChange={(p) => setSettings((prev) => ({ ...prev, ...p }))}
          onAcademicChange={(p) =>
            setSuite((prev) => ({
              ...prev,
              academicDefaults: { ...prev.academicDefaults, ...p },
            }))
          }
          onReset={handleResetDefaults}
          onSave={handleSave}
        />
      )}

      {subTab === "automation" && (
        <SettingsAutomationTab
          mode={mode}
          schoolId={schoolId}
          academicYear={academicYear}
          data={data}
          automation={suite.automation}
          canManageSettings={canManageSettings}
          saving={saving}
          onAutomationChange={(p) =>
            setSuite((prev) => ({ ...prev, automation: { ...prev.automation, ...p } }))
          }
          onSwitchSuiteTab={onSwitchSuiteTab}
          onAutomationExecuted={async (message) => {
            onNotifyFeedback({ type: "ok", message });
            await onReloadOverview();
          }}
          onDownloadReport={onDownloadReport}
          onReset={handleResetDefaults}
          onSave={handleSave}
        />
      )}

      {subTab === "notifications" && (
        <SettingsNotificationsTab
          data={data}
          notifications={suite.notifications}
          canManageSettings={canManageSettings}
          saving={saving}
          onNotificationsChange={(p) =>
            setSuite((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, ...p },
            }))
          }
          onSendTestNotification={handleTestNotification}
          onReset={handleResetDefaults}
          onSave={handleSave}
        />
      )}

      {subTab === "access" && (
        <SettingsAccessPermissionsTab
          data={data}
          accessControl={suite.accessControl}
          canManageSettings={canManageSettings}
          saving={saving}
          onAccessChange={(p) =>
            setSuite((prev) => ({
              ...prev,
              accessControl: { ...prev.accessControl, ...p },
            }))
          }
          onReset={handleResetDefaults}
          onSave={handleSave}
        />
      )}

      {subTab === "audit" && <SettingsAuditLogsTab mode={mode} schoolId={schoolId} />}
    </div>
  );
}
