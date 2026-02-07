import { describe, expect, it } from "vitest";
import { normalizeHashtags } from "@/lib/generator";

describe("normalizeHashtags", () => {
  it("should prefix tags with # and remove extra symbols", () => {
    const input = ["coffee", "##Latte", " ☕ ", ""];
    const output = normalizeHashtags(input);

    expect(output).toEqual(["#coffee", "#Latte", "#☕"]);
  });

  it("should drop empty tags after trimming", () => {
    const input = ["   ", "#", " #trend "];
    const output = normalizeHashtags(input);

    expect(output).toEqual(["#trend"]);
  });
});
