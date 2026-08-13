import { describe, expect, it } from "vitest";
import { getMenuDirection } from "../client/src/lib/menu-position";

describe("inventory context menu positioning", () => {
  it("opens upward when the trigger is near the bottom safe area", () => {
    expect(getMenuDirection(780, 844)).toBe("up");
    expect(getMenuDirection(500, 844)).toBe("down");
  });

  it("reserves space for the menu and bottom navigation", () => {
    expect(getMenuDirection(620, 720, 120, 100)).toBe("up");
    expect(getMenuDirection(400, 720, 120, 100)).toBe("down");
  });
});
