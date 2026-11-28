// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchoolWorkspaceShell } from "@/modules/school/components/school-workspace-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("SchoolWorkspaceShell single-tenant & in-portal help links", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("removes help icon button from top nav bar while keeping in-portal /{schoolSlug}/help links", () => {
    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    const helpBtn = document.querySelector("#school-portal-help-btn");
    expect(helpBtn).toBeNull();
    expect(screen.queryByText("Need Help or Have Suggestions?")).toBeNull();

    const inPortalHelpLinks = Array.from(document.querySelectorAll("a")).filter(
      (el) => el.getAttribute("href") === "/synthetic-demo-academy/help",
    );
    expect(inPortalHelpLinks.length).toBeGreaterThanOrEqual(1);

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
    expect(screen.getByRole("link", { name: "Overview" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/admissions?tab=overview",
    );
    expect(screen.getByRole("link", { name: "Applications" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/admissions?tab=applications",
    );
    expect(screen.getByRole("link", { name: "Enquiries" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/admissions?tab=enquiries",
    );
    expect(screen.getByRole("link", { name: "Admitted Students" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/admissions?tab=admitted",
    );
    expect(screen.getByRole("link", { name: "Admission Settings" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/admissions?tab=settings",
    );

    await userActor.click(admissionsBtn);
    expect(admissionsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("#admissions-submenu")).toBeNull();
  });

  it("switches Admissions tabs client-side without full navigation when onSelectAdmissionsTab is provided", async () => {
    const userActor = userEvent.setup();
    const onSelectAdmissionsTab = vi.fn();

    render(
      <SchoolWorkspaceShell
        school={school}
        user={user}
        activeNav="admissions"
        activeAdmissionsTab="overview"
        onSelectAdmissionsTab={onSelectAdmissionsTab}
      >
        <div>Admissions Body</div>
      </SchoolWorkspaceShell>,
    );

    const applicationsLink = screen.getByRole("link", { name: "Applications" });
    await userActor.click(applicationsLink);
    expect(onSelectAdmissionsTab).toHaveBeenCalledWith("applications");

    await userActor.click(screen.getByRole("link", { name: "Admission Settings" }));
    expect(onSelectAdmissionsTab).toHaveBeenCalledWith("settings");
  });

  it("renders the header theme toggle button and toggles dark class standalone", async () => {
    document.documentElement.className = "";
    localStorage.clear();
    const userActor = userEvent.setup();

    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    const toggle = screen.getByTestId("theme-toggle");
    expect(toggle).toBeInTheDocument();

    await userActor.click(toggle);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await userActor.click(toggle);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("renders Students and Parents & Guardians under the Academics dropdown instead of multi-item sub-dropdowns", async () => {
    const userActor = userEvent.setup();
    render(
      <SchoolWorkspaceShell school={school} user={user} activeNav="dashboard">
        <div>Workspace Content</div>
      </SchoolWorkspaceShell>,
    );

    expect(document.querySelector("#students-dropdown-btn")).toBeNull();
    expect(document.querySelector("#parents-submenu")).toBeNull();

    const academicsBtn = document.querySelector("#academics-dropdown-btn") as HTMLButtonElement;
    expect(academicsBtn).not.toBeNull();
    expect(academicsBtn.getAttribute("aria-expanded")).toBe("false");

    await userActor.click(academicsBtn);
    expect(academicsBtn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Classes & Subjects" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/academics",
    );
    expect(screen.getByRole("link", { name: "Students" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/students",
    );
    expect(screen.getByRole("link", { name: "Parents & Guardians" }).getAttribute("href")).toBe(
      "/synthetic-demo-academy/parents",
    );
  });
});
