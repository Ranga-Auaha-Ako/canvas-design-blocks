// https://stackoverflow.com/a/9517879
const script = document.createElement('script');
script.src = (chrome || browser).runtime.getURL('canvas-blocks.min.js');
(document.head || document.documentElement).appendChild(script);
  