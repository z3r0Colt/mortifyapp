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
