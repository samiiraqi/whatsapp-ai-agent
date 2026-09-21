import { describe, it, expect } from "vitest";
import express from "express";

describe("server skeleton", () => {
  it("can create an Express app", () => {
    const app = express();
    expect(typeof app.listen).toBe("function");
  });
});
