# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Please write a brief description at the top of each version in "Overview". This should be a short summary of the changes in the release, and is displayed in the app when a new version is available. If there are no changes worth notifying users (such as a patch after a major release), you can not include this section to prevent the app from notifying users (instead showing the last version's overview).

## [Unreleased]

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