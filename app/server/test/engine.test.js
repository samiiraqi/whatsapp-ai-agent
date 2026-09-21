import { describe, it, expect } from "vitest";
import { ConversationEngine } from "../src/engine.js";
import { ConversationStore } from "../src/store.js";
import { FakeMessageSender } from "../src/messageSender.js";

const business = {
  name: "Test Shop",
  address: "1 Test Street",
  hours: "Mon-Fri 09:00-17:00",
  currency: "USD",
  products: [{ name: "Widget", price: 1 }],
};

function buildBrain(response) {
  return { reply: () => response };
}

describe("ConversationEngine", () => {
  it("sends the brain's reply and stores both sides of the conversation", async () => {
    const store = new ConversationStore();
    const sender = new FakeMessageSender();
    const brain = buildBrain({ text: "We're open Mon-Fri 09:00-17:00.", handoff: false });
    const engine = new ConversationEngine({ brain, store, sender });

    await engine.handleMessage({ from: "15551234567", text: "hours?" });

    expect(sender.sent).toEqual([
      { to: "15551234567", text: "We're open Mon-Fri 09:00-17:00.", id: "fake-1" },
    ]);
    expect(store.isHandoff("15551234567")).toBe(false);
    expect(store.getMessages("15551234567")).toHaveLength(2);
  });

  it("marks the conversation as handed off and stops auto-replying", async () => {
    const store = new ConversationStore();
    const sender = new FakeMessageSender();
    const brain = buildBrain({ text: "Connecting you to a human.", handoff: true });
    const engine = new ConversationEngine({ brain, store, sender });

    await engine.handleMessage({ from: "15551234567", text: "human please" });
    await engine.handleMessage({ from: "15551234567", text: "hello again" });

    expect(store.isHandoff("15551234567")).toBe(true);
    expect(sender.sent).toHaveLength(1);
  });
});
