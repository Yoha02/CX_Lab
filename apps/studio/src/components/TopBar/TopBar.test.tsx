import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopBar } from "./TopBar.js";

describe("TopBar", () => {
  it("renders brand and fires reset", () => {
    const onReset = vi.fn();
    render(<TopBar onReset={onReset} />);
    expect(screen.getByText(/cx_lab dojo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
  });
});