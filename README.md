# Canvas Design Blocks

Create and edit no-code design elements built right into your Canvas Pages!

## Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
  - [Theme Installation](#theme-installation)
  - [User Script Installation](#user-script-installation)
- [Development](#development)
  - [Getting Started](#getting-started)
  - [Creating new elements](#creating-new-elements)

## Features

### Grids

- Create simple responsive grid layouts in-editor
- Adjust background colours and create drop-shadow cards to highlight important content
  ![Grids](docs/assets/grid.png)

### Buttons

- Make links stand out with customisable buttons
- Swap button colours and add icons to make your buttons pop
  ![Grids](docs/assets/button.png)

### Headers

- Create headers for your course pages, with built-in background image and layout options
  ![Grids](docs/assets/header.jpeg)

### Image Card Navigation

- Create image cards with customisable links to other pages in your course
- Best used for top-level navigation
  ![Grids](docs/assets/image-cards.png)

### Deep integration into Canvas RCE

- All design blocks are fully integrated into the Canvas RCE, so you can edit them just like any other content
- The editing interface uses popups with settings overlaid on the page, so you can see how your changes will look in real-time, and easily make adjustments
  ![Grids](docs/assets/rce.png)

## Installation

Canvas Design Blocks works as a theme for Canvas, but can be installed as a user script using a browser extension like [Tampermonkey](https://www.tampermonkey.net/) for testing.

**NOTE: Other users will have to install the script to see the designs, so you will need to use the theme version for production.**

### Theme Installation

1. Download the latest release from the [Releases](https://github.com/Ranga-Auaha-Ako/canvas-design-blocks/releases) page.
2. Host the extracted folder on a static web server (e.g. S3 behind Cloudfront) which supports HTTPS and can be accessed by users on your Canvas instance. These files will potentially download on every page load, so set responsible caching headers and use a CDN if required.
3. In Canvas, go to **Admin > Themes > Add Theme** and add the following content to the **CSS** section, replacing `{INSERT_HOST_HERE}` with the URL of the folder you hosted in step 2:

```css
@import url("{INSERT_HOST_HERE}/canvas-blocks.css}");
/* Design Blocks End */
```

4. Add the following content to the **JavaScript** section, replacing `{INSERT_HOST_HERE}` with the URL of the folder you hosted in step 2, and `{VERSION}` with the version of the release you downloaded (adding the version number to the URL is reccomended but not required):

```js
// Design Blocks Start
(function (n) {
  typeof define == "function" && define.amd ? define(n) : n();
})(function () {
  "use strict";
  const n = document.createElement("script");
  (n.src = "{INSERT_HOST_HERE}/canvas-blocks.min.js?v={VERSION}"),
    (n.type = "module"),
    (document.head || document.documentElement).appendChild(n);
});

// Design Blocks End
```

5. Save and apply the theme. You're done!

### User Script Installation

1. Download the latest release from the [Releases](https://github.com/Ranga-Auaha-Ako/canvas-design-blocks/releases) page.
2. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
3. Create a new script in Tampermonkey, adjust the `@match` URL to match your Canvas instance, and paste the contents of `canvas-blocks.min.js` into the script.
4. Add the following content to the **CSS** section, replacing `{INSERT_CSS_HERE}` with the CSS from `canvas-blocks.css`:

```js
const style = document.createElement("style");
style.type = "text/css";
style.textContent = `
{INSERT_CSS_HERE}
`;
document.head.appendChild(style);
```

5. Save the script and navigate to your Canvas instance. You're done!

## Development

This project is built on [Vite](https://vitejs.dev/) and [Svelte](https://svelte.dev/). To get started, you will need to have [Node.js](https://nodejs.org/en/) installed, as well as [Yarn V3](https://v3.yarnpkg.com/).

### Getting Started

1. Clone the repository
2. Create a `.env` file in the root of the project with the following contents, replacing the values with your own:

```Shell
CANVAS_BLOCKS_BASE_DOMAINS={YOUR_CANVAS_DOMAIN}
CANVAS_BLOCKS_THEME_HOST=http://localhost:5173/
CANVAS_BLOCKS_THEME_CONTACT_NAME={YOUR_CONTACT_NAME}
CANVAS_BLOCKS_THEME_CONTACT_EMAIL={YOUR_CONTACT_EMAIL}
```

3. Run `yarn install` to install dependencies
4. Run `yarn dev` to start the development server.
5. Open `http://localhost:5173/` in your browser to view the demo page.

This will start a local server which will serve the demo page and the theme files. The demo page will automatically reload when changes are made to the source files.

### Creating new elements

Design Blocks provides a number of abstract classes you can implement to handle most of the heavy lifting interacting with the Canvas and TinyMCE APIs. You should start by reading through the [existing elements](src/lib/elements) to get an idea of how they work.

New elements have the following high-level components:

1. An **Element Manager**, which is responsible for overseeing all instances of the element on the page, and handling the discovery and creation of new instances of the element.

   - All element managers should extend the [`ElementManager`](src/lib/elements/generic/elementManager.ts) class, and be loaded in `main.ts`

2. An **Element**, which represents a specific instance of the element on the page. This is responsible for rendering the element in the TinyMCE editor, and handling any changes made to the element. There are two ways to do this.

   - Extend the [`MceElement`](src/lib/elements/generic/mceElement.ts) class, which provides a number of helper functions for interacting with the TinyMCE API. This is the more _low-level_ approach, and is used for elements which require more direct control over the TinyMCE editor.
   - Extend the [`SvelteElement`](src/lib/elements/generic/svelteElement.ts) class, which provides a number of helper functions for interacting with the TinyMCE API, and also renders a Svelte component in the editor. This is the more _high-level_ approach, and is used for elements which can be easily represented by a Svelte component in-editor. **This is the recommended approach** for most elements which won't contain other elements or complex content. You can see an example of this in the [Button](src/lib/elements/svelteButton) element.

3. A **Svelte Component**, which is used to render the element in the TinyMCE editor. This is only required if you are using the `SvelteElement` class.

4. A **Styles** file, which is used to style the element in the TinyMCE editor and on the page.

5. A **Popup Component**, which is used to render the element's settings popup. This is only required if you have additional settings which should be displayed in a popup.
