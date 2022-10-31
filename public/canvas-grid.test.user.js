// ==UserScript==
// @name         Canvas Grid Builder (Test)
// @namespace    https://raa.auckland.ac.nz
// @version      0.1
// @description  Adds Canvas Grid from the development instance to Canvas;;
// @author       Zac M-W, Ranga Auaha Ako
// @match        https://*.instructure.com/*
// @match        https://canvas.auckland.ac.nz/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @grant        GM_addElement
// ==/UserScript==

(function () {
  GM_addElement("script", {
    src: "http://localhost:5173/src/main.ts",
    type: "module",
  });
})();
