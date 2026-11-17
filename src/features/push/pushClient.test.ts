import { describe, expect, it } from "vitest";
import { applicationServerKey } from "./pushClient";

describe("applicationServerKey", () => {
  it("decodes a base64url key, with or without padding", () => {
    // 0xfb 0xff 0xfe is "-__-" in base64url ("+//+" in plain base64)
    expect([...applicationServerKey("-__-")]).toEqual([0xfb, 0xff, 0xfe]);
    expect([...applicationServerKey("AQI")]).toEqual([1, 2]);
    expect([...applicationServerKey("AQI=")]).toEqual([1, 2]);
  });

  it("gives the 65 bytes of a P-256 public key", () => {
    const key = "B" + "A".repeat(86);
    expect(applicationServerKey(key)).toHaveLength(65);
  });
});
