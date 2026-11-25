// @vitest-environment jsdom
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchoolWorkspaceShell } from "@/modules/school/components/school-workspace-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("SchoolWorkspaceShell single-tenant & in-portal help links", () => {
  const school = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Synthetic Demo Academy",
    slug: "synthetic-demo-academy",
    code: "SDA-101",
    affiliationBoard: "CBSE",
  };
  const user = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Synthetic Principal",
    displayRole: "School Admin",
    avatarInitials: "SP",
    email: "admin@scholonix.example",
    phone: "+919000000001",
  };

  it("renders only the authenticated school identity without a multi-school switcher dropdown", () => {
    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    expect(screen.getAllByText("Synthetic Demo Academy").length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector("#school-switcher-dropdown-btn")).toBeNull();
    expect(screen.queryByText(/Select Registered School/i)).toBeNull();
  });

  it("routes top-right help button and Help Center links inside /{schoolSlug}/help rather than public /help", () => {
    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    const helpBtn = document.querySelector("#school-portal-help-btn");
    expect(helpBtn).not.toBeNull();
    expect(helpBtn?.getAttribute("href")).toBe("/synthetic-demo-academy/help");

    const allLinks = Array.from(document.querySelectorAll("a"));
    const publicExternalLinks = allLinks.filter((el) => {
      const href = el.getAttribute("href");
      return href === "/help" || href === "/contact" || href === "/feedback" || href === "/dashboard";
    });
    expect(publicExternalLinks).toHaveLength(0);
  });
});
