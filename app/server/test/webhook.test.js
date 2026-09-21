import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { sign } from "../src/signature.js";

const APP_SECRET = "test-app-secret";
const VERIFY_TOKEN = "test-verify-token";

function buildApp(onMessage = vi.fn()) {
  return createApp({
    verifyToken: VERIFY_TOKEN,
    appSecret: APP_SECRET,
    onMessage,
  });
}

describe("GET /webhook", () => {
  it("returns the challenge when the verify token is correct", async () => {
    const res = await request(buildApp()).get("/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "12345",
    });

    expect(res.status).toBe(200);
    expect(res.text).toBe("12345");
  });

  it("returns 403 when the verify token is wrong", async () => {
    const res = await request(buildApp()).get("/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong-token",
      "hub.challenge": "12345",
    });

    expect(res.status).toBe(403);
  });
});

describe("POST /webhook", () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: "15551234567",
                  id: "wamid.1",
                  timestamp: "1700000000",
                  type: "text",
                  text: { body: "Hello" },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const body = JSON.stringify(payload);

  it("accepts a valid signature and passes the message to the handler", async () => {
    const onMessage = vi.fn();

    const res = await request(buildApp(onMessage))
      .post("/webhook")
      .set("Content-Type", "application/json")
      .set("X-Hub-Signature-256", sign(body, APP_SECRET))
      .send(body);

    expect(res.status).toBe(200);
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ from: "15551234567", text: "Hello" })
    );
  });

  it("rejects a wrong signature and does not process the message", async () => {
    const onMessage = vi.fn();

    const res = await request(buildApp(onMessage))
      .post("/webhook")
      .set("Content-Type", "application/json")
      .set("X-Hub-Signature-256", sign(body, "wrong-secret"))
      .send(body);

    expect(res.status).toBe(401);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("rejects a missing signature header", async () => {
    const onMessage = vi.fn();

    const res = await request(buildApp(onMessage))
      .post("/webhook")
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(401);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("rejects a signature header of the wrong length instead of crashing", async () => {
    const onMessage = vi.fn();

    const res = await request(buildApp(onMessage))
      .post("/webhook")
      .set("Content-Type", "application/json")
      .set("X-Hub-Signature-256", "sha256=tooshort")
      .send(body);

    expect(res.status).toBe(401);
    expect(onMessage).not.toHaveBeenCalled();
  });
});
