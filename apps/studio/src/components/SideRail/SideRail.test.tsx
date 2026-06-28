import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SideRail } from "./SideRail.js";

describe("SideRail", () => {
  it("shows Maya from the mock data source in display mode", async () => {
    render(<SideRail />);
    await waitFor(() => expect(screen.getByText("Maya")).toBeInTheDocument());
    expect(screen.getByText(/display mode/i)).toBeInTheDocument();
  });
});