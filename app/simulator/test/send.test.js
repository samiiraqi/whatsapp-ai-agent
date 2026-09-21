import { describe, it, expect } from "vitest";
import request from "supertest";
import { createSimulatorApp } from "../src/app.js";

describe("POST /send", () => {
  it("rejects a request missing phone or text", async () => {
    const app = createSimulatorApp({
      appServerUrl: "http://127.0.0.1:1",
      appSecret: "secret",
    });

    const res = await request(app).post("/send").send({ text: "hi" });

    expect(res.status).toBe(400);
  });
});
