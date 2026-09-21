import { describe, it, expect } from "vitest";
import { ConversationStore, hashPhone } from "../src/store.js";

describe("ConversationStore", () => {
  it("records messages and handoff status under a hashed phone number", () => {
    const store = new ConversationStore();
    const phone = "15551234567";

    store.addMessage(phone, "in", "Hi");
    store.addMessage(phone, "out", "Hello!");
    store.setHandoff(phone, true);

    expect(store.getMessages(phone)).toEqual([
      expect.objectContaining({ direction: "in", text: "Hi" }),
      expect.objectContaining({ direction: "out", text: "Hello!" }),
    ]);
    expect(store.isHandoff(phone)).toBe(true);
  });

  it("never stores the raw phone number, only its hash", () => {
    const store = new ConversationStore();
    const phone = "15551234567";

    store.addMessage(phone, "in", "Hi");

    const rows = store.db.prepare("SELECT * FROM conversations").all();
    expect(rows).toHaveLength(1);
    expect(rows[0].phone_hash).toBe(hashPhone(phone));
    expect(JSON.stringify(rows[0])).not.toContain(phone);
  });
});
