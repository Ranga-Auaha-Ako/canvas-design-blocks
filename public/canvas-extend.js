// https://stackoverflow.com/a/9517879
const script = document.createElement('script');
script.src = chrome.runtime.getURL('canvas-grid.umd.cjs');
(document.head || document.documentElement).appendChild(script);
