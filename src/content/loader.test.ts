import { describe, expect, it, vi, afterEach } from "vitest";
import { featuredSermonsSchema, loadPacks, packSchema } from "./loader";
import { readFileSync } from "node:fs";
import pack from "../../public/content/lust.json";
import index from "../../public/content/index.json";
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
  it("every battle pack in the index matches the schema", () => {
    for (const file of index as string[]) {
      const json = JSON.parse(
        readFileSync(`public/content/${file}`, "utf8"),
      ) as unknown;
      const result = packSchema.safeParse(json);
      expect(result.success, `${file}: ${result.error?.message}`).toBe(true);
    }
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
describe("prayers", () => {
  const packs = (index as string[]).map((file) =>
    packSchema.parse(
      JSON.parse(readFileSync(`public/content/${file}`, "utf8")),
    ),
  );
  it("every battle has a confession for after a fall and prayers for Flee", () => {
    for (const p of packs) {
      expect(p.prayers.filter((x) => x.for === "fall").length).toBeGreaterThan(
        0,
      );
      expect(p.prayers.filter((x) => x.for === "flee").length).toBeGreaterThan(
        1,
      );
      // The original confession is shown first after a fall.
      expect(p.prayers[0]).toMatchObject({ for: "fall" });
      expect(p.prayers[0].author).toBeUndefined();
    }
  });
  it("a historic prayer always names its author and source", () => {
    const prayer = { for: "flee", title: "T", text: "Words" };
    const withPrayer = (extra: object) =>
      packSchema.safeParse({
        ...pack,
        prayers: [...pack.prayers, { ...prayer, ...extra }],
      }).success;
    expect(withPrayer({})).toBe(true);
    expect(withPrayer({ author: "Matthew Henry" })).toBe(false);
    expect(
      withPrayer({
        author: "Matthew Henry",
        source: "A Method for Prayer, ch. 3",
      }),
    ).toBe(true);
    expect(
      packSchema.safeParse({
        ...pack,
        prayers: pack.prayers.filter((p) => p.for !== "fall"),
      }).success,
    ).toBe(false);
  });
  it("the original prayers speak to sisters as well as brothers", () => {
    for (const p of packs)
      for (const x of p.prayers.filter((x) => !x.author))
        expect(
          [x.opening, x.text, x.closing].join(" "),
          `${p.id}: ${x.title}`,
        ).not.toMatch(/\b(brethren|a brother)\b/i);
  });
  it("every prayer opens in adoration and closes with Amen", () => {
    for (const p of packs)
      for (const x of p.prayers) {
        expect(x.opening, `${p.id}: ${x.title}`).toBeTruthy();
        expect(x.closing, `${p.id}: ${x.title}`).toMatch(/Amen\.$/);
        expect(x.text, `${p.id}: ${x.title}`).not.toMatch(/Amen\.$/);
      }
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
