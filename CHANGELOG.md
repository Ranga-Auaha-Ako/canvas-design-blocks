# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Please write a brief description at the top of each version in "Overview". This should be a short summary of the changes in the release, and is displayed in the app when a new version is available. If there are no changes worth notifying users (such as a patch after a major release), you can not include this section to prevent the app from notifying users (instead showing the last version's overview).



## [2.14.7] - 2025-03-31

### 1. Security patch

Upgraded `tar-ts` to V3.0.8 due to previous version (V3.0.5) [vulnerability](https://github.com/advisories/GHSA-pq67-2wwv-3xjx). 

This is done via adding the following to `package.json` and then run `yarn install`.
`package.json` and `yarn.lock` are both now updated. 
```
  "resolutions": {
    "tar-fs": "^3.0.8",
    "@puppeteer/browsers/tar-fs": "^3.0.8",
    "find-chrome-bin/tar-fs": "^3.0.8",
    "puppeteer-core/tar-fs": "^3.0.8",
    "@puppeteer/browsers": "2.8.0"
  }
```

### 2. Fixed

1. <b>courseHeader</b>: &ensp; Fixed `coruseHeader` tetx color inheriting header background color issue.
   - [Source]: src > lib > elements > courseHeader: `popup > headerConfig.svelte`, `courseHeader.ts`, `courseHeaderInner.svelte`.
   <br>
   
2. <b>Image Card</b>: &ensp; Fixed the issue of image card label text colour turning dark when being placed inside a Design Block Grid with background colour.
   - [Source]: `src > lib > elements > imageCard > element.postcss`.
<br>


## [2.14.6] - 2025-03-11

### Reverted one 2.14.5 change:
1. <b>Image Card</b>: Removed the "Alt text" input box to reduce chances of conflict with Canvas image upload "Decorative" flag and causing error with UDOIT checks. All Image Card image alt text is defaulted back to "".
   - [Source]: src > lib > elements > imageCard: `popup > imageCardConfig.svelte`, `imageCard.ts`, `imageCardInner.svelte`, `imageCardLegacy.ts`.
   <br>


## [2.14.5] - 2025-01-23

### Added
1. <b>Image Card</b>: Added "open in new tab" option to Image Card URL setting; added an "Alt text" input box below the URL setting are.
   - [Source]: src > lib > elements > imageCard: `popup > imageCardConfig.svelte`, `imageCard.ts`, `imageCardInner.svelte`, `imageCardLegacy.ts`.
   <br><br>

2. <b>Button Bar</b>:  Added a "remove icon" option in Button Bar.
   - [Source]: src > lib > elements > buttonBar > popup > `buttonBarConfig.svelte`.
<br><br>

3. <b>Button</b>:  Added a "remove icon" option in Button.
   - [Source]: src > lib > elements > svelteButton > popup > `buttonConfig.svelte`.
<br><br>


### Fixed

1. <b>Glossary</b>: Fixed the issue of non-English words in the course glossary list were not always rendered with mouseover glossary display.  Design Block Glossary should now pick up all the words in the glossary list regardless of casing and character set (e.g. accented/macrons). 
   - [Cause]: Javascript Regex is Unicode-unaware, so the old code extracted "words" using `\b` (word boundary) that was determined based on transitions between `\w` (word characters) and `\W` (non-word characters), while `\w` only covers ASCII set. Thus this failed to capture non-English words.    
   - [Source]: src > lib > elements > glossary > `glossaryClientManager.ts`.
   - [Fixes]: Regex pattern, source & target text normalisation, and regex matching indexing logic update via `getTermRegex`, `termWalker`, `addGlossaryTags`. 
<br><br>
  
2. <b>Icon</b>: Fixed the issue of some icons not rendering (e.g. "Koru" (the fern) from the Aotearoa icon series).
   - [Cause]: The old Glossary module talked through all text nodes, including those within icon elements, and inserted glossary span tags that breaks up the icon markup structure.
   - [Source]: src > lib > elements > glossary > `glossaryClientManager.ts`.
   - [Fixes]: Excluded nodes whose parents are in the ExcludedClasses list in `termWalker`. 
<br><br>

3. <b>Grid</b>: Fixed non-zero padding/margin when popover slider padding/margin is set to 0.  
   - [Cause]: In `preferences = writableDerived(...)`, as long as the slider is touched even when returning 0, the code explicitly set the style to 0px. This causes the default margin in `gridEditor.postcss` to take effect:
    `cssCopy.mce-content-body [data-cdb-id] {
      &.canvas-grid-editor {
        @apply p-3 m-3; 
      }
    }` (This applies margin: 0.75rem (12px))
   - [Source]: src > lib > elements > grid > popup > advancedSettings > `rowSettings.svelte`.
   - [Fixes]: Updated `oldStyle.padding` and `oldStyle.margin` assignment logic to remove style if the value is 0. 
<br><br>

4. <b>Course Header</b>: Fixed the issue of pasted header Title text being overwritten in edit mode when the popover panel was triggered before saving the Canvas page. Now one can paste Title text and format it using Canvas page editor before saving the page, and triggering the popover will not overwrite the text.

   - [Cause]: 1) Previous code's `HeaderState` constructor does not capture in-edit, unsaved text changes; 2) Paste handler dispatched the update event before the state (cdbData.title) got updated with the pasted content; 3) There is no event-listener on style change; 4) previous `CoursHeader` constructor does not preserve the latest DOM state after triggering popover.
   - [Source]: src > lib > elements > courseHeader > `courseHeader.ts`, `courseHeaderInner.svelte`.
   - [Fixes]: 
     - In `courseHeader.ts`, updated class `HeaderState` constructor to prioritize existing DOM content first, followed by passed-in states (unsafeState?.title); updated `CourseHeader` constructor to preserve current DOM state before triggering popover. 
     - In `courseHeaderInner.svelte`, added `setupMutationObserver` to listen to style change (made via Canvas page editor); updated `<h2 ...>` to use the MutationOvserver, and modified `on:paste` to preserve both source text and formatting, and to update `cdbData.title` as soon as text is pasted in Title.
<br><br>

5. <b>Button Bar</b>: Bug fixes: 1) Button 3 was previously not editable. 2) Creating >1 Button Bars in page edit mode would result in the subsequent Button Bars all having the custom buttons added in the first one.  Now all new Button Bars will be created with the default state.   

   - [Cause]: 1) The old code did not assign Button 3 any moduleID for proper indexing. 2) The old code used a static variable for default ButtonBar state which can be changed by instances. 
   - [Source]: src > lib > elements > buttonBar > `buttonBar.ts`, `popup > buttonBarConfig.svelte`.
   - [Fixes]: 
     - `buttonBar.ts`: replaced `static defaultState` with `static getDefaultState()`, added moduleID to Button 3.
     - `buttonBarConfig.svelte`, updated `cardIndex` definition to handle buttons without moduleID.
     <br><br>


## [2.14.4] - 2024-10-29

### Fixed

- Updated two scripts in src > lib > elements > courseHeader:
  - `courseHeader.ts`:  Updated the courseHeader constructor and `static defaultState: HeaderData ` to check and preserve existing Title text and style.
  - `courseHeaderInner.svelte`: Updated the headerTitle code to reflect the preservation of existing title text and style.  Added mouse right-click to handle pasting text.

## [2.14.3] - 2024-10-07

### Fixed

- Updated `.env.example` and the following sections of `README` in response to [Discussion #80](https://github.com/Ranga-Auaha-Ako/canvas-design-blocks/discussions/80):

  -  `Prerequisites`: Added Python version requirements;
  - `Configuration and Building`:  added explaination and examples of CANVAS_BLOCKS_THEME_CONTACT_NAME, CANVAS_BLOCKS_THEME_CONTACT_LINK in the `.env` file. 
  -  `Testing the theme`: Fixed the url for `The Canvas Design Blocks CSS` and `The Canvas Design Blocks JS` scripts. These were auto-built from .github > workflows > release-on-tag.yml, running a local build to generate the `dist` subdir shows that the actual file name (i.e. url path).
  -  `Creating new elements`: Updated the line "All element managers should extend the ElementManager class ..." into "All element managers should extend the ElementManager class, and be loaded in EditorLoader.ts to be imported to and instantiated in desktop.ts." for precision.

## [2.14.2] - 2024-07-31

### Fixed

- A few minor tweaks to improve betterCanvas support

## [2.14.1] - 2024-07-30

### Fixed

- Removed glossary from mobile code entirely

## [2.14.0] - 2024-07-30

### Overview

- ✨ Hover over blocks below for a new tooltip! Dark mode in the mobile app now works better, and you can choose to preview or download linked files.

### Added

- Tooltips for each block in the toolbar to help users understand what each block does
- Dark Mode & Better Canvas support! Design Blocks now supports dark mode, and has improved support for the Mobile app dark mode.
- Link selection allows downloading or previewing the linked file rather than just defaulting to download.

### Changed

- Button Bar block no longer a "progress" bar by default
- Enabled Glossary example in the sandpit

### Fixed

- Issue where changing the background colour of a grid to a colour and back to unset would cause the text colour to get stuck on a fixed colour. This looked fine on desktop, but on mobile dark mode the dark text with transparent (dark) background was unreadable.
- Fix issue with header sizing on mobile when there was an image selected

## [2.13.3] - 2024-06-11

### Fixed

- Term definitions now inherit colour styling from parent element

## [2.13.2] - 2024-06-10

### Fixed

- Fix icons "wrapping" in some cases and becomming hidden
- Prevent glossary tool reccomending linking with pages that are not created by the Design Blocks tool

### Changed

- Simplify glossary creation process

## [2.13.1] - 2024-06-10

### Overview

- ✨ New: Glossaries! Create and edit a list of terms and definitions to be highlighted in course content on the web.

### Fixed

- Fix glossary detection for students when pages are hidden

### Changed

- Glossary no longer supports Mobile: the mobile app's API functionality is not yet stable enough to ensure a consistent experience for users.

## [2.13.0] - 2024-05-13

### Added

- New: Glossaries! Create and edit a list of terms and definitions to be highlighted in course content.
- Client-side components can now be added to the page, and can be whitelisted to specific account IDs to phase rollout.

## [2.12.1] - 2024-05-05

### Fixed

- Added debounce to mutation observer, preventing situation where the app would hang if an error occured causing the mutation observer to affect iteself and cause a loop.

### Changed

- Updated the image card config panel to make more sense

## [2.12.0] - 2024-05-01

### Overview

- ✨ New: copy and paste grid rows, and profile backgrounds can now be any colour.

### Added

- Profile backgrounds can now be any colour, and the text will automatically adjust to be readable.
- Design Blocks now works with a specific build for mobile
- Copy and paste grid rows
- Client-side blocks now possible

## [2.11.2] - 2024-02-02

### Overview

- "Modern" is now the default header theme - give it a go! Pasting into header blocks also now works as expected.

### Changed

- Modern is now the default theme.
- Modern theme: reworked header links completely to be more visually appealing.
- Can now build into "sandpit mode" which provides a non-canvas environment for testing the production build of the tool.
- "Mock" files in seach results are pulled from a real directory rather than using picsum.photos placeholder images.
- Modern theme: links can now span two lines to allow Maori translations to be displayed.

### Fixed

- Fix #49: Pasting content into header blocks now works

## [2.11.1] - 2024-01-30

### Fixed

- Fix #23: Inherit image and link URLs from DOM, resolving migration issues
- Various bugfixes and improvements to the modern theme released in 2.11.0

## [2.11.0] - 2024-01-30

### Overview

- Canvas Design Blocks has had a spring cleaning! Icons now work better, load faster, and have improved support for mobile devices. You can step through pages of link and image search results, and we've also created a new "Button Bar" block, which allows you to create a row of buttons or a progress bar with a single click. Happy new year!

### Added

- #48: New "Button Bar" block
- #29: New "Icon" element
- #44: Search results are now paginated
- #9: Drag handle for grids
- #58: Select header level in Course Headers
- #46: Improve blank profile UX
- Allow users to hide "Bio" title in profile

### Changed

- #24: Integrated Iconset generation - Canvas Design Blocks no longer relies on third party host for icons, and uses an iconfont rather than individual SVGs. This means that icons load faster, and are more reliable on mobile devices.
- Sort toolbar alphabetically, and add icons

### Fixed

- #37: Built-in icons don't load on mobile, plus sizing issues
- #43: Full-width buttons fixed on Firefox

## [2.10.0] - 2023-10-24

### Added

- Add "open in new tab" to buttons and header links

### Fixed

- Fix #1: Improve logic for grid deletion
- Fix #31: Implement accessibility warnings where colour picker is used
- Make buttons in grids behave properly
- Fix to colour picker positioning
- Make image cards have minimum height

## [2.9.2] - 2023-10-18

### Overview

- Lots of bugfixes and improvements in this release, including a fix for images in grids not loading properly, and some changes to make inserting blocks into the page feel a bit snappier.

### Fixed

- Fix #27: Issue with images in grids not loading properly
- Fix #14: Elements accidentally place inside the cursor
- Fix #38: Bugfixing for the icon selector and link picker
- Persist preferred image card theme
- Improvements to responsive grid sizing in image cards

## [2.9.1] - 2023-10-17

### Fixed

- Small bugfixes and typo corrections in codebase
- Use HTML links for pages rather than just pagename
- Improvements to version display logic

## [2.9.0] - 2023-10-17

### Overview

- This release contains a number of bugfixes and improvements, including a new "Create Blank" profile option, better link editing, and a number of UX niceities.

### Added

- Google Analytics Integration
- "Create Blank" Canvas profile option
- Improve link editing experience
- Improve UX of header links panel
- Full-width buttons
- Allow picking background colours for profiles

### Fixed

- Pressing "Enter" in elements triggers popover focus rather than adding new line
- False UDOIT accessibility warnings
- Links to external sites break with new Svelte buttons
- Icon Selector closes other active modals
- Colour Picker broken on Safari
