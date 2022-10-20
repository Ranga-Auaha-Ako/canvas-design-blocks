# Canvas TinyMCE Grid plugin

This plugin enables users to create or update responsive grids within Canvas's TinyMCE (v5) editor.

<figure>
    <img src="demos/Update_Grids.gif?raw=true" alt="Example of creating a grid"/>
    <figcaption>Example of creating a grid</figcaption>
</figure>
<table border="0">
 <tr>
    <td>
        <figure>
            <img src="demos/Update_Grids.gif?raw=true" alt="Example of updating a grid"/>
            <figcaption>Example of updating a grid</figcaption>
        </figure>
    </td>
    <td>
        <figure>
            <img src="demos/Delete_Grids.gif?raw=true" alt="Example of deleting a grid"/>
            <figcaption>Example of deleting a grid</figcaption>
        </figure>
    </td>
 </tr>
</table>

## Testing

If you'd like to use this plugin but don't want to install it on your Canvas installation, you can use the userscript above. To do this, you'll need to make sure you have [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Tampermonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) installed. Once you've done that, click on the link in the header to install the script and activate on any domains that are on a "https://canvas.*/" url (eg canvas.auckland.ac.nz). Feel free to change this URL on your version of the script so that it works on your install as needed. Line 5 of the userscript has this url setting.

## Limitations

This plugin only creates or updates simple grids. Nested grids or mulitiple target screen grids are not supported.

## Installation

### _Note: these instructions are mostly copied from the original repository, and are not ready to use yet. For now, only install using a userscript like the one provided above._

1. Using TinyMCE CDN

   1. Copy the plugin and paste it into your application folder.
   2. Initialized the editor with following configurations (please check demos)

   ```javascript
   tinyMCE.init({
          selector: "textarea",
          external_plugins: {
              'canvasgrid': 'https://ranga-auaha-ako.github.io/tiny-canvas-grid/src/plugin.js' //local path to plugin.min.js file
          },
          theme: 'modern',
          plugins: [
              ... ' canvasgrid'
          ],
          toolbar: ... 'canvasgrid'
      });
   ```

2. Using TinyMC locally

   1. Copy the plugin folder and paste it into the tinymce/plugins/ folder along with other tinymce official plugins in the application.
   2. Initialized the editor with following configurations:

   ```javascript
        tinyMCE.init({
          selector: "textarea",
          theme: 'modern',
          plugins: [
              ... ' canvasgrid'
          ],
          toolbar: ... 'canvasgrid'
      });
   ```

## Chnage Log

- V1.1 Canvas Support - November 23, 2021
  - Forked for Canvas LMS support
- V0.3 Enhancement - April 24, 2019
  - Enable users to remove bootstrap grid system while maintain the same contents
- V0.2 Enhancements & Bug fixes - April 9, 2019
  - Update the CSS styles to show grid borders only in Edit mode
  - Update the CSS styles to automatically show the grid width label in Edit mode
  - Disable the resize handler in IE11
  - Update the JS files to not show static width info in text
  - Update the function in JS files to detect the grid classes
  - Fix the demo/Tiny5BS4.html ending title tag typo
- V0.1 Initial Commit - Mar 29, 2019

## Credits:

This project was inspired and modified from [tiny-bs-bgrid](https://github.com/jeffhehe/tiny-bs-grid) authored by Jeff Wang, which itself was inspired and modified from [tiny-grid](https://github.com/aaroniker/tiny-grid) authored by Aaron Iker.
