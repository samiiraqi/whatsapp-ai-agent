import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Conversations } from "../src/components/Conversations.jsx";

const conversation = {
  id: "abc12345",
  language: "en",
  handoff: true,
  lastMessageAt: "2026-01-01T00:00:00.000Z",
  messages: [
    { direction: "in", text: "Can I talk to a human?", createdAt: "2026-01-01T00:00:00.000Z" },
  ],
};

describe("Conversations", () => {
  it('shows a "Handed to human" badge for a conversation in handoff', () => {
    render(<Conversations conversations={[conversation]} />);

    expect(screen.getByText("Handed to human")).toBeInTheDocument();
  });
});
