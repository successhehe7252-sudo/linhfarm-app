import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("Inventory context menu integration contract", () => {
  it("renders a direction-aware action menu with both product actions", () => {
    expect(home).toContain("action-menu action-menu-${menuDirection}");
    expect(home).toContain("Chỉnh sửa thông tin");
    expect(home).toContain("Xóa sản phẩm");
    expect(home).toContain("getMenuDirection(trigger.bottom, window.innerHeight");
  });

  it("keeps the last row clear of the fixed bottom navigation", () => {
    expect(css).toContain(".inventory-table { position:relative; overflow:visible; padding-bottom:100px; }");
    expect(css).toContain(".action-menu { z-index:80;");
    expect(css).toContain(".action-menu-up { top:auto; bottom:39px; }");
    expect(css).toContain(".bottom-nav { display:flex; position:fixed;");
  });
});
