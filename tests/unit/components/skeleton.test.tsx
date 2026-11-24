// @vitest-environment jsdom
import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton component", () => {
  it("renders with default pulse and background classes", () => {
    const { getByTestId } = render(<Skeleton data-testid="test-skeleton" />);
    const element = getByTestId("test-skeleton");

    expect(element).toBeInTheDocument();
    expect(element).toHaveClass("animate-pulse");
    expect(element).toHaveClass("bg-[#E9EBF8]/75");
    expect(element).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom className and dimensions properly", () => {
    const { getByTestId } = render(
      <Skeleton
        data-testid="custom-skeleton"
        className="h-12 w-48 rounded-full bg-[#EDE7FF]"
      />,
    );
    const element = getByTestId("custom-skeleton");

    expect(element).toHaveClass("h-12");
    expect(element).toHaveClass("w-48");
    expect(element).toHaveClass("rounded-full");
    expect(element).toHaveClass("bg-[#EDE7FF]");
  });

  it("forwards extra HTML attributes correctly", () => {
    render(<Skeleton id="banner-skeleton" role="presentation" />);
    const element = document.getElementById("banner-skeleton");

    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute("role", "presentation");
  });
});
