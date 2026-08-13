export type MenuDirection = "up" | "down";

export function getMenuDirection(triggerBottom: number, viewportHeight: number, menuHeight = 96, bottomSafeArea = 110): MenuDirection {
  const spaceBelow = viewportHeight - triggerBottom - bottomSafeArea;
  return spaceBelow < menuHeight ? "up" : "down";
}
