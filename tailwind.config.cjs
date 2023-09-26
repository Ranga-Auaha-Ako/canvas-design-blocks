require("dotenv").config();

const themeEnv = process.env.CANVAS_BLOCKS_THEME;
const theme = themeEnv ? JSON.parse(themeEnv) : {};

const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  corePlugins: {
    preflight: false,
  },
  important: ".cgb-component",
  theme: {
    extend: {
      colors: {
        primary: theme.primary || "#0374B5",
        secondary: theme.secondary || "#2D3B45",
        gray: theme.gray || {
          100: "#F2F2F2",
          200: "#D9D9D9",
          300: "#BEC3C4",
          400: "#4A4A4C",
          500: "#404040",
          600: "#333333",
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
