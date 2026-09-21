import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MockBrain } from "../src/mockBrain.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const business = JSON.parse(
  fs.readFileSync(path.join(dirname, "../config/business.json"), "utf8")
);

describe("MockBrain", () => {
  const brain = new MockBrain(business);

  it("answers an hours question", () => {
    const { text, handoff } = brain.reply({ text: "What are your opening hours?" });

    expect(handoff).toBe(false);
    expect(text).toContain(business.hours);
  });

  it("answers a price question", () => {
    const { text, handoff } = brain.reply({ text: "How much does the bread cost?" });

    expect(handoff).toBe(false);
    expect(text).toContain("Fresh Bread");
  });

  it("replies in Arabic to an Arabic message", () => {
    const { text, handoff } = brain.reply({ text: "ما هي ساعات العمل؟" });

    expect(handoff).toBe(false);
    expect(text).toContain(business.hours);
    expect(text).toMatch(/[؀-ۿ]/);
  });

  it("hands off when the customer asks for a human", () => {
    const { handoff } = brain.reply({ text: "Can I speak to a human please?" });

    expect(handoff).toBe(true);
  });

  it("hands off when it doesn't understand the question", () => {
    const { handoff } = brain.reply({ text: "asdkjfh qwoeiru zzzxx" });

    expect(handoff).toBe(true);
  });
});
