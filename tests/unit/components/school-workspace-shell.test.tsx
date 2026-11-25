// @vitest-environment jsdom
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(allLinks.filter((el) => {
      const href = el.getAttribute("href");
      return href === "/help" || href === "/contact" || href === "/feedback" || href === "/dashboard";
    })).toHaveLength(0);
  });

  it("removes School Web Panel text and provides a fixed scrollable sidebar open by default with a toggle button", async () => {
    const userActor = userEvent.setup();
    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    expect(screen.queryByText("School Web Panel")).toBeNull();

    const sidebar = document.querySelector("#school-sidebar");
    expect(sidebar).not.toBeNull();
    expect(sidebar?.className).toContain("fixed");
    expect(sidebar?.className).toContain("lg:translate-x-0");

    const scrollableBody = sidebar?.querySelector(".overflow-y-auto");
    expect(scrollableBody).not.toBeNull();
    expect(scrollableBody?.className).toContain("school-menu-scrollbar");

    const desktopToggle = document.querySelector("#desktop-sidebar-toggle-btn") as HTMLButtonElement;
    expect(desktopToggle).not.toBeNull();
    expect(desktopToggle.getAttribute("aria-expanded")).toBe("true");

    await userActor.click(desktopToggle);
    expect(desktopToggle.getAttribute("aria-expanded")).toBe("false");
    expect(sidebar?.className).toContain("lg:-translate-x-full");

    await userActor.click(desktopToggle);
    expect(desktopToggle.getAttribute("aria-expanded")).toBe("true");
    expect(sidebar?.className).toContain("lg:translate-x-0");
  });

  it("renders Admissions as a dropdown closed by default that toggles open on click", async () => {
    const userActor = userEvent.setup();
    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    const admissionsBtn = document.querySelector("#admissions-dropdown-btn") as HTMLButtonElement;
    expect(admissionsBtn).not.toBeNull();
    expect(admissionsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("#admissions-submenu")).toBeNull();
    expect(screen.queryByRole("button", { name: "Applications" })).toBeNull();

    await userActor.click(admissionsBtn);
    expect(admissionsBtn.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("#admissions-submenu")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Applications" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enquiries" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Admitted Students" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Admission Settings" })).toBeTruthy();

    await userActor.click(admissionsBtn);
    expect(admissionsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("#admissions-submenu")).toBeNull();
  });
});
