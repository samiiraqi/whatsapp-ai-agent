import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ConversationStore, hashPhone } from "../src/store.js";

function buildApp(devSimulator) {
  const store = new ConversationStore();
  const app = createApp({
    verifyToken: "token",
    appSecret: "secret",
    onMessage: () => {},
    devSimulator,
    store,
  });
  return { app, store };
}

describe("GET /dev/conversations", () => {
  it("returns 404 when DEV_SIMULATOR is not true", async () => {
    const { app } = buildApp(false);

    const res = await request(app).get("/dev/conversations");

    expect(res.status).toBe(404);
  });

  it("returns each conversation with a short id, language, handoff, last message time, and messages", async () => {
    const { app, store } = buildApp(true);
    const phone = "15551234567";

    store.addMessage(phone, "in", "שלום, מה השעות שלכם?");
    store.addMessage(phone, "out", "אנחנו פתוחים בימים א'-ה'.");
    store.setHandoff(phone, true);

    const res = await request(app).get("/dev/conversations");

    expect(res.status).toBe(200);
    expect(res.body.conversations).toEqual([
      expect.objectContaining({
        id: hashPhone(phone).slice(0, 8),
        language: "he",
        handoff: true,
        lastMessageAt: expect.any(String),
        messages: [
          expect.objectContaining({ direction: "in", text: "שלום, מה השעות שלכם?" }),
          expect.objectContaining({ direction: "out", text: "אנחנו פתוחים בימים א'-ה'." }),
        ],
      }),
    ]);
  });
});
