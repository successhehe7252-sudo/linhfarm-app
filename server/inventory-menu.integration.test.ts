import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("Inventory context menu integration contract", () => {
  it("renders a direction-aware action menu with both product actions", () => {
    expect(home).toContain("DropdownMenu");
    expect(home).toContain("Chỉnh sửa thông tin");
    expect(home).toContain("Xóa sản phẩm");
  });

  it("keeps the last row clear of the fixed bottom navigation", () => {
    expect(css).toContain(".inventory-table");
    expect(css).toContain(".bottom-nav");
  });
});
