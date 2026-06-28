import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SideRail } from "./SideRail.js";

vi.mock("../../data/index.js", () => ({
  getDataSource: () => ({
    getProfile: async () => null,
    getProfileMemory: async () => [],
  }),
}));

describe("SideRail", () => {
  it("renders brand and empty profile state", () => {
    render(<SideRail />);
    expect(screen.getByText("CX_lab Dojo")).toBeInTheDocument();
    expect(screen.getByText(/active profile/i)).toBeInTheDocument();
  });
});
