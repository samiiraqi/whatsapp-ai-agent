import { describe, it, expect } from "vitest";
import { FakeMessageSender } from "../src/messageSender.js";

describe("FakeMessageSender", () => {
  it("stores outgoing messages in memory instead of sending them", async () => {
    const sender = new FakeMessageSender();

    const result = await sender.send("15551234567", "Hello!");

    expect(result.id).toBeTruthy();
    expect(sender.sent).toEqual([
      { to: "15551234567", text: "Hello!", id: result.id },
    ]);
  });
});
