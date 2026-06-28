import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DreamPanel } from "./DreamPanel.js";

describe("DreamPanel", () => {
  it("shows the cluster patch and approves it", async () => {
    render(<DreamPanel />);
    fireEvent.click(screen.getByRole("button", { name: /dream pass/i }));
    await waitFor(() => expect(screen.getByText(/replacement inventory/i)).toBeInTheDocument());
    expect(screen.getAllByText(/first_time_buyer/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() => expect(screen.getByText(/approved/i)).toBeInTheDocument());
  });
});