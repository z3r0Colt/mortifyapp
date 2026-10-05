import { describe, expect, it, vi, afterEach } from "vitest";
import { featuredSermonsSchema, loadPacks, packSchema } from "./loader";
import pack from "../../public/content/lust.json";
afterEach(() => vi.unstubAllGlobals());
describe("content validation", () => {
  it("accepts the lust pack and rejects incomplete packs", () => {
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
describe("sermon links", () => {
  it("keeps sermons optional and accepts only SermonAudio links", () => {
    const { sermons, ...withoutSermons } = pack;
    expect(packSchema.parse(withoutSermons).sermons).toEqual([]);
    expect(packSchema.parse(pack).sermons.length).toBeGreaterThan(0);
    expect(
      packSchema.safeParse({
        ...pack,
        sermons: [{ ...sermons[0], url: "https://example.com/sermon" }],
      }).success,
    ).toBe(false);
  });
});
describe("sermons", () => {
  it("every pack and the featured list validate, with no repeated link in a list", async () => {
    const { readFile } = await import("node:fs/promises");
    const read = async (file: string) =>
      JSON.parse(await readFile(`public/content/${file}`, "utf8"));
    const lists = [];
    for (const file of (await read("index.json")) as string[])
      lists.push(packSchema.parse(await read(file)).sermons);
    const featured = featuredSermonsSchema.parse(await read("sermons.json"));
    lists.push(featured.flee, featured.general);
    for (const list of lists)
      expect(new Set(list.map((s) => s.url)).size).toBe(list.length);
    expect(featured.flee.length).toBeGreaterThan(0);
  });
});
