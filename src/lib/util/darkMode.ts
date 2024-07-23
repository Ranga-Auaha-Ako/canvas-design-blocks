import { colord } from "colord";
import { writable } from "svelte/store";

export const isDarkMode = writable<undefined | boolean>(undefined);

let betterCanvasEl: HTMLStyleElement | null = null;

isDarkMode.subscribe((enabled) => {
  if (enabled === undefined) {
    return;
  }
  if (enabled) {
    document.body.classList.add("cdb--dark");
  } else {
    document.body.classList.remove("cdb--dark");
  }
});

const observeBetterCanvas = (element: HTMLStyleElement) => {
  isDarkMode.set(element.classList.contains("bettercanvas-darkmode-enabled"));
  const observer = new MutationObserver(() => {
    isDarkMode.set(element.classList.contains("bettercanvas-darkmode-enabled"));
  });
  observer.observe(element, { attributes: true, attributeFilter: ["class"] });
};

function getBetterCanvasState() {
  const hasBetterCanvas = document.getElementById("bettercanvas-aesthetics");
  if (!hasBetterCanvas) {
    isDarkMode.set(false);
    return;
  }
  betterCanvasEl = document.querySelector("style#darkcss");
  if (!betterCanvasEl) {
    // Better Canvas is installed but dark mode is not enabled. Watch DOM for element appearing
    const observer = new MutationObserver(() => {
      betterCanvasEl = document.querySelector("style#darkcss");
      if (betterCanvasEl) {
        observeBetterCanvas(betterCanvasEl);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: false });
  } else {
    observeBetterCanvas(betterCanvasEl);
  }
}

function getMobileDarkMode() {
  const background = window.getComputedStyle(document.body).backgroundColor;
  colord(background).isDark() ? isDarkMode.set(true) : isDarkMode.set(false);
}

function getDarkModeState() {
  if (import.meta.env.MODE.includes("mobile")) {
    getMobileDarkMode();
  } else {
    getBetterCanvasState();
  }
}

// Wait for page load before starting search
switch (document.readyState) {
  case "loading":
    window.addEventListener("DOMContentLoaded", () => {
      getDarkModeState();
    });
    break;
  case "interactive":
  case "complete":
    getDarkModeState();
    break;
}
