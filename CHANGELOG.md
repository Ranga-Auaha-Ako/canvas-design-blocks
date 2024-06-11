# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Please write a brief description at the top of each version in "Overview". This should be a short summary of the changes in the release, and is displayed in the app when a new version is available. If there are no changes worth notifying users (such as a patch after a major release), you can not include this section to prevent the app from notifying users (instead showing the last version's overview).

## [Unreleased]

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
