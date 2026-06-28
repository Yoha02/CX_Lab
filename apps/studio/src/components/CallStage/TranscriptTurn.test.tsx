import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TranscriptTurn } from "./TranscriptTurn.js";

describe("TranscriptTurn", () => {
  it("shows original, english, and frustration for a shopper turn", () => {
    render(
      <TranscriptTurn
        turn={{
          turn_id: 1,
          speaker: "shopper",
          original: "Esto es inaceptable",
          english: "This is unacceptable",
          lang: "es-ES",
          sentiment: { label: "frustrated", frustration: 0.8 },
        }}
      />
    );
    expect(screen.getByText("Esto es inaceptable")).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("This is unacceptable"))).toBeInTheDocument();
    expect(screen.getByText(/frustrated/i)).toBeInTheDocument();
  });
});