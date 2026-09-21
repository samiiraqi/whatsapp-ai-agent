import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { LocalCrm } from "../src/localCrm.js";

function buildApp(devSimulator) {
  const crm = new LocalCrm();
  const app = createApp({
    verifyToken: "token",
    appSecret: "secret",
    onMessage: () => {},
    devSimulator,
    crm,
  });
  return { app, crm };
}

describe("GET /dev/leads", () => {
  it("returns 404 when DEV_SIMULATOR is not true", async () => {
    const { app } = buildApp(false);

    const res = await request(app).get("/dev/leads");

    expect(res.status).toBe(404);
  });

  it("returns the leads stored by LocalCrm when enabled", async () => {
    const { app, crm } = buildApp(true);

    crm.saveLead({
      name: "Dana",
      item: "Fresh Bread",
      language: "en",
      createdAt: "2026-01-01T00:00:00.000Z",
      conversationHash: "abc123",
    });

    const res = await request(app).get("/dev/leads");

    expect(res.status).toBe(200);
    expect(res.body.leads).toEqual([
      expect.objectContaining({ name: "Dana", item: "Fresh Bread" }),
    ]);
  });
});
