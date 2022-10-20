# Canvas Grid Builder

This plugin enables users to create or update responsive grids within Canvas's Rich Text Editor.

## Demo Version

An interactive demo version of this tool installed on a fictional Canvas editing page is available at [https://gridbuilder.test.raa.amazon.auckland.ac.nz/demo.html](https://gridbuilder.test.raa.amazon.auckland.ac.nz/demo.html).

<div style="margin-top:2rem;margin-bottom:1rem;text-align: center;">
    <a target="_blank" href="https://gridbuilder.test.raa.amazon.auckland.ac.nz/demo.html" class="btn btn-dark" >View Demo</a>
</div>

This version is the real tool, but installed on a mockup of a Canvas page rather than the real thing. It is intended to give you a feel for how the tool works, and to help you understand the use case.

## Testing

If you'd like to use this plugin but don't want to install it on your Canvas installation, you can use the userscript above. To do this, you'll need to make sure you have [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Tampermonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) installed. Once you've done that, click on the link in the header to install the script and activate on any domains that are on Instructure's domain "https://\*.instructure.com/" url (eg auckland.instructure.com). Feel free to change this URL on your version of the script so that it works on your install as needed. Line 7-8 of the userscript has this url setting.

## Limitations

This plugin only creates or updates simple grids. Nested grids or custom grids are not yet supported, but may be in a future version. Right now, the tool only allows one grid per page for simplicity.

## Installation

## Chnage Log

- V0.1.0 Initial version with basic functionality - Oct 20, 2022
