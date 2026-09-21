import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConversationEngine } from "../src/engine.js";
import { ConversationStore } from "../src/store.js";
import { FakeMessageSender } from "../src/messageSender.js";
import { LocalCrm } from "../src/localCrm.js";
import { MockBrain } from "../src/mockBrain.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const business = JSON.parse(
  fs.readFileSync(path.join(dirname, "../config/business.json"), "utf8")
);

function buildEngine() {
  const store = new ConversationStore();
  const sender = new FakeMessageSender();
  const crm = new LocalCrm();
  const brain = new MockBrain(business);
  const engine = new ConversationEngine({ brain, store, sender, crm });
  return { engine, store, sender, crm };
}

describe("order flow", () => {
  it("collects name and item in English and saves a lead", async () => {
    const { engine, store, sender, crm } = buildEngine();
    const phone = "15551234567";

    await engine.handleMessage({ from: phone, text: "I'd like to order please" });
    await engine.handleMessage({ from: phone, text: "Dana" });
    await engine.handleMessage({ from: phone, text: "Fresh Bread" });

    expect(sender.sent).toHaveLength(3);
    expect(sender.sent[2].text).toContain("Fresh Bread");
    expect(store.isHandoff(phone)).toBe(false);

    const leads = crm.getLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      name: "Dana",
      item: "Fresh Bread",
      language: "en",
    });
    expect(leads[0].createdAt).toBeTruthy();
    expect(leads[0].conversationHash).toBeTruthy();
    expect(leads[0].conversationHash).not.toBe(phone);
  });

  it("collects name and item in Arabic and saves a lead", async () => {
    const { engine, crm } = buildEngine();
    const phone = "15557654321";

    await engine.handleMessage({ from: phone, text: "أريد أن أطلب" });
    await engine.handleMessage({ from: phone, text: "سارة" });
    await engine.handleMessage({ from: phone, text: "خبز" });

    const leads = crm.getLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      name: "سارة",
      item: "خبز",
      language: "ar",
    });
  });

  it("lets a human request in the middle of the flow stop it, without saving a lead", async () => {
    const { engine, store, sender, crm } = buildEngine();
    const phone = "15559998888";

    await engine.handleMessage({ from: phone, text: "I want to order" });
    await engine.handleMessage({
      from: phone,
      text: "actually, can I speak to a human?",
    });
    await engine.handleMessage({ from: phone, text: "Dana" });

    expect(store.isHandoff(phone)).toBe(true);
    expect(store.getFlowState(phone)).toBeNull();
    expect(crm.getLeads()).toHaveLength(0);
    // ask-name + handoff message; the 3rd message is suppressed post-handoff
    expect(sender.sent).toHaveLength(2);
  });
});
