import { colord } from "colord";

export const findNearestBackgroundColor: (
  el: HTMLElement,
  window: Window | undefined
) => string = (el) => {
  if (el === window?.document.body || !window) {
    return "#0000";
  }
  const computedStyle = window.getComputedStyle(el);
  const backgroundColor = computedStyle.backgroundColor;
  const c = colord(backgroundColor);
  if (c.alpha() === 0 && el.parentElement) {
    return findNearestBackgroundColor(el.parentElement, window);
  }
  return c.toHex();
};
