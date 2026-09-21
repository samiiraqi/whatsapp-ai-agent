import { describe, it, expect } from "vitest";
import { LocalCrm } from "../src/localCrm.js";

describe("LocalCrm", () => {
  it("saves and retrieves leads", () => {
    const crm = new LocalCrm();

    crm.saveLead({
      name: "Dana",
      item: "Fresh Bread",
      language: "en",
      createdAt: "2026-01-01T00:00:00.000Z",
      conversationHash: "abc123",
    });

    expect(crm.getLeads()).toEqual([
      expect.objectContaining({
        name: "Dana",
        item: "Fresh Bread",
        language: "en",
        conversationHash: "abc123",
      }),
    ]);
  });
});
