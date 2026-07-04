import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { typeRegistry } from "../src/core/sbcgProfile";

describe("type documentation", () => {
  it("documents every registered grammar type", () => {
    Object.keys(typeRegistry).forEach((typeName) => {
      const doc = readFileSync(`docs/types/${typeName}.md`, "utf8");

      expect(doc).toContain(`# ${typeName}`);
      expect(doc).toContain("## Parent type");
      expect(doc).toContain("## Licensed features");
      expect(doc).toContain("## Example JSON");
      expect(doc).toContain("## Notes");
    });
  });
});
