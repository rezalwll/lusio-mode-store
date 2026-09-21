import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button (test-infrastructure sanity check)", () => {
  it("renders, responds to clicks, and matches accessible text", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>افزودن به سبد خرید</Button>);

    const button = screen.getByRole("button", { name: "افزودن به سبد خرید" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("افزودن به سبد خرید");

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
