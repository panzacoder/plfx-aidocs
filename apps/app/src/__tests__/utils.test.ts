import { describe, it, expect } from "vitest";
import { getLocaleCurrency } from "@/utils/misc";

describe("getLocaleCurrency", () => {
  it("returns usd", () => {
    expect(getLocaleCurrency()).toBe("usd");
  });
});
