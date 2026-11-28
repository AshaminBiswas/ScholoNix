// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import { ThemeProvider } from "@/components/theme/theme-provider";
import { SCHOLONIX_OPENAPI_SPEC } from "@/modules/docs/openapi-spec";
import { SwaggerDocsExplorer } from "@/modules/docs/components/swagger-docs-explorer";
import { GET as getOpenApiSpec } from "@/app/api/docs/openapi.json/route";

describe("Swagger OpenAPI Spec, School User Docs, and MIT License", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("ships a valid MIT LICENSE and matching package.json metadata", () => {
    const licenseText = readFileSync(path.join(process.cwd(), "LICENSE"), "utf8");
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

    expect(licenseText).toContain("MIT License");
    expect(licenseText).toContain("Permission is hereby granted, free of charge");
    expect(pkg.license).toBe("MIT");
  });

  it("keeps docs/api/openapi.json and /api/docs/openapi.json synchronized", async () => {
    const fileSpec = JSON.parse(
      readFileSync(path.join(process.cwd(), "docs", "api", "openapi.json"), "utf8"),
    );

    expect(fileSpec.openapi).toBe("3.0.3");
    expect(fileSpec.info.license.name).toBe("MIT");
    expect(fileSpec).toEqual(SCHOLONIX_OPENAPI_SPEC);
    expect(fileSpec.paths["/api/school/students/overview"]).toBeTruthy();
    expect(fileSpec.paths["/api/platform/students/overview"]).toBeTruthy();

    const response = await getOpenApiSpec();
    expect(response.status).toBe(200);
    const jsonBody = await response.json();
    expect(jsonBody).toEqual(SCHOLONIX_OPENAPI_SPEC);
  });

  it("includes comprehensive school usage documentation", () => {
    const guide = readFileSync(
      path.join(process.cwd(), "docs", "school-user-guide.md"),
      "utf8",
    );
    expect(guide).toContain("Student Management Suite");
    expect(guide).toContain("Admissions");
    expect(guide).toContain("Student Promotion");
    expect(guide).toContain("Student Transfer");
    expect(guide).toContain("MIT License");
  });

  it("renders interactive SwaggerDocsExplorer with Light/Dark theme support and filtering", () => {
    const { container } = render(
      <ThemeProvider>
        <SwaggerDocsExplorer spec={SCHOLONIX_OPENAPI_SPEC} />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /ScholoNix Multi-Tenant School Management SaaS API/i }),
    ).toBeTruthy();
    expect(container.innerHTML).toContain("dark:bg-[#090A1A]");

    const searchInput = screen.getByLabelText(/Filter API endpoints$/i);
    fireEvent.change(searchInput, { target: { value: "/api/school/students/promote" } });
    expect(screen.getByText("/api/school/students/promote")).toBeTruthy();
    expect(screen.queryByText("/api/health")).toBeNull();
  });
});
