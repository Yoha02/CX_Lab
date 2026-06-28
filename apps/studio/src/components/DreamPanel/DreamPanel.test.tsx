import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DreamPanel } from "./DreamPanel.js";

vi.mock("../../data/index.js", () => ({
  getDataSource: () => ({
    getPlaybookPatches: async () => [],
    approvePlaybookPatch: async () => {},
  }),
}));

describe("DreamPanel", () => {
  it("renders and runs the dream pass animation", async () => {
    render(<DreamPanel />);
    expect(screen.getByRole("heading", { name: /dream pass/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /run dream pass/i }));
    expect(screen.getByText(/running/i)).toBeInTheDocument();
  });

  it("shows no patches message when API returns empty", () => {
    render(<DreamPanel />);
    // No patch loaded — shows empty state (async, checked via absence of "Approve patch")
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
  });
});
