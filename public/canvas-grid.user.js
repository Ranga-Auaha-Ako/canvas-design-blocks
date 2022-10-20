// ==UserScript==
// @name         Canvas Grid Builder (Staging)
// @namespace    https://raa.auckland.ac.nz
// @version      0.1
// @description  Adds Canvas Grid from the development instance to Canvas;;
// @author       Zac M-W, Ranga Auaha Ako
// @match        https://*.instructure.com/courses/*/pages/*/edit
// @match        https://canvas.auckland.ac.nz/courses/*/pages/*/edit
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @grant        GM_addElement
// ==/UserScript==

(function () {
  GM_addElement("script", {
    src: "https://gridbuilder.test.raa.amazon.auckland.ac.nz/canvas-grid.umd.js",
    type: "text/javascript",
  });
  GM_addElement("link", {
    href: "https://gridbuilder.test.raa.amazon.auckland.ac.nz/style.css",
    rel: "stylesheet",
  });
})();
