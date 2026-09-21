import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { FakeMessageSender } from "../src/messageSender.js";
import { ConversationStore } from "../src/store.js";

function buildApp(devSimulator) {
  const sender = new FakeMessageSender();
  const store = new ConversationStore();
  const app = createApp({
    verifyToken: "token",
    appSecret: "secret",
    onMessage: () => {},
    devSimulator,
    sender,
    store,
  });
  return { app, sender, store };
}

describe("GET /dev/outbox", () => {
  it("returns 404 when DEV_SIMULATOR is not true", async () => {
    const { app } = buildApp(false);

    const res = await request(app).get("/dev/outbox");

    expect(res.status).toBe(404);
  });

  it("returns the messages stored by FakeMessageSender, with handoff status", async () => {
    const { app, sender, store } = buildApp(true);

    await sender.send("15551234567", "Hello!");
    store.setHandoff("15551234567", true);

    const res = await request(app).get("/dev/outbox");

    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([
      expect.objectContaining({
        to: "15551234567",
        text: "Hello!",
        handoff: true,
      }),
    ]);
  });
});
