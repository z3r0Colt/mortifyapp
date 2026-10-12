import { expect, it } from "vitest";
import { plainMessage } from "./messages";
it("strips links while retaining plain text", () => {
  expect(
    plainMessage(
      "Please check https://example.com/a and www.example.org today",
    ),
  ).toBe("Please check  and  today");
  expect(plainMessage("<script>text</script>")).toBe("<script>text</script>");
});

it("cleans a bare www. or https:// the same way the database does", () => {
  expect(plainMessage("Pray now https://")).toBe("Pray now");
  expect(plainMessage("see http:// ok")).toBe("see  ok");
  expect(plainMessage("I read it on www.")).toBe("I read it on");
});
