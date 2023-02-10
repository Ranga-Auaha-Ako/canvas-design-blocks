// https://stackoverflow.com/a/9517879
const script = document.createElement('script');
script.src = (chrome || browser).runtime.getURL('canvas-grid.min.js');
(document.head || document.documentElement).appendChild(script);
  