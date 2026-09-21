import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Leads } from "../src/components/Leads.jsx";

const leads = [
  {
    id: 1,
    name: "Dana",
    item: "Fresh Bread",
    language: "en",
    createdAt: "2026-01-01T00:00:00.000Z",
    conversationHash: "abcdef1234567890",
  },
  {
    id: 2,
    name: "Sam",
    item: "Orange Juice",
    language: "en",
    createdAt: "2026-01-02T00:00:00.000Z",
    conversationHash: "1234567890abcdef",
  },
];

describe("Leads", () => {
  it("renders a row for each lead", () => {
    render(<Leads leads={leads} />);

    expect(screen.getByText("Dana")).toBeInTheDocument();
    expect(screen.getByText("Fresh Bread")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText("Orange Juice")).toBeInTheDocument();
  });
});
