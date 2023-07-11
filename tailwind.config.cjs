const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  corePlugins: {
    preflight: false,
  },
  important: ".cgb-component",
  theme: {
    extend: {
      colors: {
        "uni-blue": {
          silver: "#8D9091",
          light: "#009AC7",
          DEFAULT: "#00467F",
        },
        "uni-gray": {
          100: "#F2F2F2",
          200: "#D9D9D9",
          300: "#BEC3C4",
          400: "#4A4A4C",
          500: "#404040",
          600: "#333333",
        },
        "uni-faculty": {
          arts: "#A71930",
          business: "#7D0063",
          cai: "#D2492A",
          edu: "#55A51C",
          eng: "#4F2D7F",
          law: "#005B82",
          med: "#00877C",
          sci: "#0039A6",
        },
        "uni-research": {
          bio: "#BA4482",
          liggins: "#006990",
        },
        "uni-color": {
          red: "#A71930",
          fushia: "#7D0063",
          orange: "#D2492A",
          green: "#55A51C",
          purple: "#4F2D7F",
          teal: "#005B82",
          turqoise: "#00877C",
          blue: "#0039A6",
          rose: "#BA4482",
          "teal-alt": "#006990",
        },
      },
      boxShadow: {
        strong:
          "0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a, 0 0px 4px -2px #0000004f",
      },
    },
  },
};

module.exports = config;
