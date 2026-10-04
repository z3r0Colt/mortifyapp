import { describe, expect, it, vi, afterEach } from "vitest";
import { loadPacks, packSchema } from "./loader";
import pack from "../../public/content/lust.json";
afterEach(() => vi.unstubAllGlobals());
describe("content validation", () => {
  it("accepts the placeholder pack and rejects incomplete packs", () => {
    expect(packSchema.parse(pack).id).toBe("lust");
    expect(packSchema.safeParse({ ...pack, verses: [] }).success).toBe(false);
    expect(
      packSchema.safeParse({
        ...pack,
        verses: [{ ref: "Romans 8:13", text: "INLINE SCRIPTURE" }],
      }).success,
    ).toBe(false);
    expect(
      packSchema.safeParse({
        ...pack,
        afterFallReadings: [{ ref: "Psalm 119:9-11" }],
      }).success,
    ).toBe(true);
    expect(
      packSchema.safeParse({
        ...pack,
        afterFallReadings: [{ ref: "PLACEHOLDER REFERENCE" }],
      }).success,
    ).toBe(false);
  });
  it("refuses unsafe content paths", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ["../private.json"] })),
    );
    await expect(loadPacks()).rejects.toThrow();
  });
  it("reports a failed content fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );
    await expect(loadPacks()).rejects.toThrow("Could not load");
  });
});
