import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "../src/components/MessageBubble.jsx";

describe("MessageBubble", () => {
  it("renders a Hebrew message right-to-left", () => {
    render(<MessageBubble text="שלום, מה שלומך?" direction="in" />);

    expect(screen.getByText("שלום, מה שלומך?")).toHaveAttribute("dir", "rtl");
  });

  it("renders an English message left-to-right", () => {
    render(<MessageBubble text="Hello there" direction="out" />);

    expect(screen.getByText("Hello there")).toHaveAttribute("dir", "ltr");
  });
});
