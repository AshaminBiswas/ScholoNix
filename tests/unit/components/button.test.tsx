// @vitest-environment jsdom
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders with correct text content", () => {
    const { getByRole } = render(<Button>Click Me</Button>);
    expect(getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles click events properly", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = render(<Button onClick={handleClick}>Submit</Button>);
    await user.click(getByRole("button", { name: /submit/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    const { getByRole } = render(<Button disabled>Disabled Action</Button>);
    expect(getByRole("button", { name: /disabled action/i })).toBeDisabled();
  });
});
