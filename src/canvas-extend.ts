import mainScript from "./main?script&module";

// https://stackoverflow.com/a/9517879
const script = document.createElement("script");
script.src = (chrome || browser).runtime.getURL(mainScript);
script.type = "module";
(document.head || document.documentElement).appendChild(script);
