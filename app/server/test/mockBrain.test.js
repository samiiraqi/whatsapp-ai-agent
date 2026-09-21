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

  it("answers a price question about one product with only that product (English)", () => {
    const { text, handoff } = brain.reply({ text: "How much does the bread cost?" });

    expect(handoff).toBe(false);
    expect(text).toContain("Fresh Bread");
    expect(text).toContain("5.50");
    expect(text).not.toContain("Orange Juice");
    expect(text).not.toContain("Cheese Platter");
  });

  it("lists all products in English when none is named", () => {
    const { text, handoff } = brain.reply({ text: "What's on the menu?" });

    expect(handoff).toBe(false);
    expect(text).toContain("Fresh Bread");
    expect(text).toContain("Orange Juice");
    expect(text).toContain("Cheese Platter");
  });

  it("answers a price question about one product with only that product (Arabic)", () => {
    const { text, handoff } = brain.reply({ text: "كم سعر الخبز؟" });

    expect(handoff).toBe(false);
    expect(text).toContain("خبز طازج");
    expect(text).toContain("5.50");
    expect(text).not.toContain("عصير برتقال");
    expect(text).not.toContain("طبق جبن");
  });

  it("answers a price question about one product with only that product (Hebrew)", () => {
    const { text, handoff } = brain.reply({ text: "מה המחיר של הלחם?" });

    expect(handoff).toBe(false);
    expect(text).toContain("לחם טרי");
    expect(text).toContain("5.50");
    expect(text).not.toContain("מיץ תפוזים");
    expect(text).not.toContain("מגש גבינות");
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
