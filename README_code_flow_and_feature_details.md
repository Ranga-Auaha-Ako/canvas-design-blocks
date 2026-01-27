# Code Flow and Feature Details

## App Building Workflow

<details>
<summary>Click to view details:</summary>

### Trigger Point
Build process is triggered by `yarn build` command, which executes the following defined in `package.json`:
```
vite build --mode desktop && vite build --mode mobile
```

### Execution Flow
1. **Dual Build Process**: Yarn executes two separate Vite builds sequentially:
   - **Desktop Build**: `vite build --mode desktop` → `vite.config.js` returns `appConfig("desktop")`
   - **Mobile Build**: `vite build --mode mobile` → `vite.config.js` returns `appConfig("mobile")`

2. **Changelog Processing**: `vite.config.js` reads and parses `CHANGELOG.md` to extract latest changes:
   - Normalises Windows line endings and parses changelog content
   - **Constants Injection**: Via Vite's `define` option, injects build-time constants for two purposes:
     - **App Version Display**: `__APP_VERSION__` sourced directly from the current `package.json` version (displayed in toolbar)
     - **Change Overview Display**: `__LATEST_CHANGE__` sourced from `CHANGELOG.md` via this logic:
       - Finds latest changelog entry where `version <= current package version` AND has Overview content. This entry's version is recorded in `__LATEST_CHANGE_VERSION__`
       - Extracts the text under the `### Overview` heading from that entry for update notification display
   - **Key Distinction**: The toolbar change overview text might be from an earlier version,  if the latest changelog entry does not have the `### Overview` section 

3. **Entry Resolution**: Each build reads different entry points:
   - Desktop: `rollupOptions.input: "src/desktop.ts"`
   - Mobile: `rollupOptions.input: "src/mobile.ts"`

4. **Plugin Processing**: 
   - `getIconsPlugin()` processes SVG files and generates `virtual:blocks-icons.css`
   - `vitePluginCanvasStyles()` handles Canvas-specific styling
   - Svelte plugin compiles `.svelte` components

5. **Bundle Generation**: Outputs separate files for each platform:
   - Desktop: `canvas-blocks.min.js` and `canvas-blocks.css`
   - Mobile: `canvas-blocks-mobile.min.js` and `canvas-blocks-mobile.css`
   
</details>

-------------------------------------------------------------

## App Loading in Canvas LMS

<details>
<summary>Click to view details:</summary>

### Trigger Point
Canvas theme loads either `canvas-blocks.min.js` (desktop) or `canvas-blocks-mobile.min.js` (mobile), which executes the equivalent of `beginLaunch()` or `loadApp()` respectively from `src/desktop.ts` or `src/mobile.ts` on script execution.

### Execution Flow
*The following steps are orchestrated by functions in `src/desktop.ts`:*

1. **Version Check**: `beginLaunch()` checks `window._LOADED_DESIGNBLOCKS` to prevent duplicate loading
2. **DOM Ready**: Waits for DOM ready state, then calls `loadApp()`
3. **Page Location Validation**: `getEditor()` validates current page is a valid editing location:
   - Course pages (new/edit): `/courses/*/pages/` or `/courses/*/pages/*/edit`
   - Discussions (new/edit): `/courses/*/discussion_topics/new` or `/courses/*/discussion_topics/*/edit`
   - Assignments (new/edit): `/courses/*/assignments/new` or `/courses/*/assignments/*/edit`
   - Quizzes (edit): `/courses/*/quizzes/*/edit`
4. **App Loading Decision**: 
   - **Valid editing pages**: Continues full app loading
   - **All other Canvas pages**: App stops loading entirely (early return)
5. **Glossary Manager Loading**: Loads `glossaryClientManager` directly and calls `renderClientComponent()`
6. **Canvas RCE Detection**: `getEditor()` waits for and detects Canvas LMS's TinyMCE editor instance with timeout retry logic
7. **Element Manager Loading**: Imports `editorLoader.ts` and instantiates Canvas Design Blocks element managers for editing functionality
8. **Toolbar Loading**: `loadToolbar()` creates and mounts the Canvas Design Blocks interface in Canvas sidebar
9. **Style Injection**: Injects Tailwind and block styles into Canvas RCE's TinyMCE instance

### Toolbar Loading
When Canvas RCE's TinyMCE instance is successfully detected on valid editing pages, `loadToolbar()` creates the Design Blocks interface:

1. **Target Selection**: Finds Canvas left sidebar navigation (`#left-side #section-tabs`)
2. **DOM Injection**: Creates new `<li class="section">` element at the beginning of sidebar
3. **Component Mounting**: Instantiates `Toolbar.svelte` component with state and manager props
4. **Interface Rendering**: Displays "Design Blocks" button that toggles panel showing available design elements
5. **Event Handling**: Button click reveals/hides toolbar menu with element options and feedback link

</details>

-------------------------------------------------------------

# Components & Features

## Overall Component Colour Behaviour
<details>
<summary>Click to view details:</summary>

All Canvas Design Blocks components (except Glossary) have a colour picker, defined in `src/lib/components/colourPicker.svelte`.

Since v2.15.0:
* The colour pickers in all components will show fixed colour options from the primary, secondary, and other palette colours defined in the `.env` file.
* Meanwhile, the default component text/icon colour (except for Icon and ImageCard Light Icon mode) will be automatically set to black or white based on the selected component colour to ensure accessibility.
* There is an option to automatically filter and/or augment the colour picker’s palette options based on the component’s text colour. These options default to `false` and can be set for each component where the colour picker is instantiated via the optional props, e.g.:

    ```sveltehtml
    <ColourPicker
        label="Button Bar Colour"
        id={nanoid() + "-setting-background"}
        bind:colour={$buttonBarData.color}
        contrastColour={colord("#ffffff")}
        style="wide"
        showNone={false}
        asModal={isModal}
        
        showAccessible={true}    <!-- Will show '!' on palette options with low contrast against the text colour -->
        filterByContrast={true}  <!-- Will only display palette options with sufficient contrast to the text colour -->
        useSmartColour={true}    <!-- Will augment the colour to be lighter/darker based on the text colour -->
    />
    ```

</details>

-------------------------------------------------------------

## Button Bar

<details>
<summary>Click to view details:</summary>

The `Button Bar` component creates navigational button rows to help users quickly access important links or track progress through sequential content. 

- It offers two distinct themes: 1) `Button Group` for general flexible navigation that will auto-stack on mobile screen, and 2) `Progress` as a single-row sequential step indicator for showing advancement through a series. 


- Both themes provide full button customisation including labels, URLs, icons, and colours.


- Users can add/edit buttons manually or sync from Canvas modules, customise styling with colour picker and contrast validation, reorder buttons via drag-and-drop, and set progress position automatically or manually.

- The `Button Group` mode will auto-stack on mobile screens and retain full button label text and icon display, whereas `Progress` mode prioritises keeping the button bar in one row and truncates text for non-current pages on smaller screens.

### 1) Button Group
Creates a horizontal row of navigation buttons for quick access to important links.

**Editing Interface**: Click the Button Bar element to open the configuration panel in the Canvas sidebar.

**Available Options**:
- **Button Management**: Add new buttons, edit labels/URLs via link editor with Canvas content search, select icons from Design Blocks library, reorder via drag-and-drop, or delete buttons
- **Styling**: Set custom colour with automatic contrast validation against white text
- **Canvas Integration**: "Sync from Modules" automatically populates buttons from published course modules via Canvas Modules API

**Expected Behaviour**: 
- Buttons display horizontally with hover effects
- When >5 buttons are present, uses flex-wrap which allows buttons to wrap to multiple rows as needed
- Component validates colour contrast and warns if readability may be compromised

**Limitations**: 
- Restricted to predefined icon library, plain text labels only
- Requires published Canvas modules for sync functionality

### 2) Progress Theme  
Displays sequential progress through a series of content, showing current position and completion status.

**Editing Interface**: Select "Progress" theme in the configuration panel, then use the progress slider to set current position.

**Available Options**:
- **Position Control**: Drag slider to manually set current step in sequence (-1 to total buttons), or use automatic detection from Canvas modules
- **Button Configuration**: Same editing options as Button Group theme
- **Auto-Detection**: When syncing from modules, automatically detects current page position by matching page URL against module structure (can be manually overridden)

**Expected Behaviour**: 
- Buttons show visual progression with completed steps highlighted
- Current step displays with special styling and tooltip (position set automatically or manually)
- On mobile with >5 buttons, stays horizontal but compresses buttons to 20% width and hides labels (showing only on hover)

**Limitations**: 
- Requires sequential ordering for meaningful progress indication
- Auto-detection only works if current page exists within Canvas module structure
- Position must be manually adjusted if content structure changes.
- Progress anchor needs to be manually changed for each occurrence of the progress bar acorss the linked pages.
- On mobile screens or in narrow containers, the `Progress` mode button bar will trade off by truncating button text to remain on a single row.


</details>

-------------------------------------------------------------

## Button

<details>
<summary>Click to view details:</summary>

The `Button` component creates individual call-to-action buttons to highlight important links and guide user navigation. Buttons should be used sparingly to draw attention to specific actions you want the learners to take, rather than for general navigation.

- It provides comprehensive styling customisation including size, colours, icons, and layout options.

- Users can set custom text, URLs with Canvas content search, choose from predefined sizes, and configure visual styling with real-time contrast validation.

- The component adapts to its container context, offering a `Full Width` options when placed within Canvas a Design Blocks Grid cell in a multi-column Grid row.

### 1) Styling & Layout
Customises the visual appearance and sizing of individual buttons.

**Editing Interface**: Click the Button element to open the configuration panel in the Canvas sidebar.

**Available Options**:
- **Size Selection**: Choose from Mini, Small, Default, or Large button sizes
- **Colour Customisation**: Set the button background colour with automatic text colour (black / white) adjustment to ensure accessible contrast.
- **Layout Control**: Enable full-width display when button is placed within a Canvas a Design Blocks Grid cell in a multi-column Grid row
- **Icon Integration**: Select icons from Design Blocks library or remove existing icons

**Expected Behaviour**: 
- Buttons display with hover effects and visual feedback
- The `Full Width` option only available when button is inside a  Canvas a Design Blocks Grid cell in a multi-column Grid row
- Icon and text are automatically aligned and sized appropriately

**Limitations**: 
- Restricted to predefined icon library
- Text colour limited to automatically-set black and white only
- The `Full Width` functionality is only available to multi-column Grid rows

### 2) Content & Navigation
Configures button text, links, and navigation behaviour.

**Editing Interface**: Use the text inputs and link editor in the configuration panel.

**Available Options**:
- **Text Configuration**: Set button title and label text
- **URL Management**: Configure links via link editor with Canvas content search integration
- **Navigation Behaviour**:  `Open in new tab` option to open links in new (browser) tab or same window
- **Content Integration**: Access Canvas pages, assignments, discussions, and other course content through intelligent link suggestions

**Expected Behaviour**: 
- Link editor provides Canvas content search with auto-suggestions
- The `Open in new tab` option adds appropriate target attributes to the anchor tag
- Button text updates in real-time during editing

**Limitations**: 
- Plain text only for button labels
- Relies on Canvas content search for intelligent link suggestions
- Link validation depends on Canvas context availability

</details>

-------------------------------------------------------------

## Grid

<details>
<summary>Click to view details:</summary>

The `Grid` component creates responsive layout systems using rows and columns to organise content into structured, flexible designs.

Unlike HTML tables designed for data display, the Canvas Design Blocks Grid provides a flexible and accessible layout system that automatically adapts to screen sizes, supports rich content integration, and includes built-in styling and editing capabilities.

- It provides predefined layout templates ranging from single columns to complex multi-column arrangements with automatic responsive behavior.

- Users can add/delete rows and columns, copy/paste row content, and extensively customise styling including card effects, padding, margins, and colours.

- The component uses a responsive grid system that automatically stacks columns on smaller screens for optimal mobile viewing.

- All content pasted into a Grid will have its formatting stripped to plain text, and its text colour will be automatically set to black / white based on the Grid row / column background colour to ensure accessible contrast.



Grids contain **rows** (horizontal bands), and each row contains **columns** (vertical sections). Both rows and columns have separate styling options that work together.

### 1) Editing Interface

- Click any row within the grid to reveal the `row menu` above the row, then use layout options to modify structure. 
- Click the `Advanced Settings` button to unlock detailed styling and spacing controls.  
- Click any cell (column) in a grid to reveal the `column menu` (only displayed after `Advanced Settings` are activated) below the cell, and then configure settings only for that cell.

### 2) Available Options

- **Template Selection**: The Grid uses a 12-column system where each row's columns must add up to 12 units. The predefined layouts include: equal columns (1, 1/2+1/2, 1/3+1/3+1/3, 1/4+1/4+1/4+1/4), sidebar combinations (1/3+2/3, 2/3+1/3, 1/4+3/4, 3/4+1/4), and complex arrangements (1/4+1/2+1/4, 1/4+1/4+1/2, 1/2+1/4+1/4)
- **Row Operations**: Add rows above/below existing rows, delete rows with content confirmation, copy and paste entire rows with content
- **Responsive Behaviour**: All layouts automatically stack to full-width columns on mobile/tablet screen (< 768px width)

- **Advanced Settings**: Reveals comprehensive styling panels for both rows and columns, including:
  - **Row styling** (affects the entire horizontal band)
  - **Column styling** (affects individual vertical sections within rows)
  - **Card Effects**: Convert rows or columns to card style with shadow and rounded corners, with size variants (small, default, large corners)
  - **Spacing Controls**: Adjust padding (0-20px) and margin (0-20px) with unified or individual side controls (top, right, bottom, left)
  - **Colour Customisation**: Set background colours and text colours with automatic contrast consideration, includes "has-background" class for styling inheritance
  - **Accessibility Features**: Automatic addition of "data-phpally-ignore" class to overcome accessibility checker's DOM element hierarchy parsing limitations

### 3) Row vs Column Settings

- **Row settings** apply to the entire horizontal band and affect all columns within it
- **Column settings** apply to individual vertical sections and override row settings where they conflict
- **Styling Hierarchy**: Column backgrounds appear inside row backgrounds, column padding adds to row padding, creating layered spacing effects

**Expected Behaviour**:
- When both row and column have background colours, the column colour appears as a panel within the row colour
- Padding values combine: if a row has 10px padding and a column has 5px padding, content will have 15px total spacing from the row edge
- Advanced settings toggle is persistent across editing sessions 
- Card styling adds visual elevation and definition to content sections
- Spacing controls provide real-time visual feedback with pixel value displays
- Background colours automatically adjust text colour inheritance for nested content
- Settings persist across editing sessions and content updates

### 4) Limitations
- Limited to predefined layout templates, cannot create custom column widths outside provided options
- Mobile stacking behaviour cannot be disabled
- Styling interactions between rows and columns require understanding of CSS layering principles
- Colour options limited to single background colour per row or column
- Spacing limited to 20px maximum values
- Card corner customisation limited to three size presets.

</details>

-------------------------------------------------------------

## Header

<details>
<summary>Click to view details:</summary>

The `Header` component creates visually striking page headers to introduce sections, modules, or pages with customisable themes, content, and navigation links. 

Headers are designed for major content introductions (such as course welcomes or module starts) rather than simple section dividers - for basic content separation, consider using standard text headings or other layout components.

- It offers four distinct visual themes: Light, Dark, Blur, and Modern, each with unique layouts and styling approaches.

- Users can customise content including editable titles and descriptions, add background images, configure navigation links with icons, and adjust semantic heading levels.

- The Modern theme provides advanced layout options with icon integration, background colours, and sophisticated multi-column design, whilst other themes focus on content overlay approaches.

- All content pasted into a Header title or overview section will have its formatting stripped to plain text, and its text colour will be automatically set to black / white based on the Header background colour to ensure accessible contrast.


### 1) Theme Selection & Visual Styling
Choose from four distinct header themes, each offering different visual approaches and customisation options.

**Editing Interface**: Click the Header component to open the configuration panel, then select from available themes and styling options.

**Available Options**:
- **Theme Selection**: Choose between Light (bright overlay), Dark (dark overlay), Blur (backdrop blur effect), or Modern (multi-column layout with advanced features)
- **Background Images**: Select images from Canvas files or course content via image search integration
- **Header Level**: Set semantic heading level (H2, H3, or H4) for accessibility and document structure
- **Modern Theme Exclusive Features**:
  - Custom background colours with automatic contrast adjustment
  - Icon selection with colour customisation
  - Advanced grid-based layout with icon, content, and image sections

**Expected Behaviour**:
- Light/Dark/Blur themes display content as overlays on background images with appropriate contrast treatments
- Modern theme uses sophisticated grid layout with distinct areas for icon, content, and image
- Mobile responsiveness automatically adjusts layouts for smaller screens using container queries
- Background colour changes in Modern theme automatically adjust text colours for optimal contrast

**Limitations**: 
- Background colours and icons only available in Modern theme
- Blur effect requires browser support for backdrop-filter
- Mobile layouts may crop or reposition images differently

### 2) Content Management & Navigation
Configure header content including editable text, navigation links, and interactive elements.

**Editing Interface**: Use the content editing areas within the header and the links management section in the configuration panel.

**Available Options**:
- **Title Editing**: Directly editable heading text with formatting preservation and theme-appropriate styling
- **Overview Content**: Rich text description area supporting basic HTML formatting and pasted content
- **Link Management**: Add, edit, and reorder navigation links with:
  - Custom titles (multi-line supported in Modern theme)
  - URL configuration via Canvas content search integration
  - Icon selection for visual enhancement
  - New tab opening options
- **Content Integration**: Links can point to Canvas pages, assignments, discussions, and external resources

**Expected Behaviour**:
- Title and overview text are directly editable within the header component
- Paste operations strip formatting to maintain theme consistency
- Links display differently based on theme: overlaid buttons for Light/Dark/Blur themes, integrated tray for Modern theme
- Link icons automatically inherit appropriate colours based on theme and background
- Multi-line link titles supported in Modern theme for more descriptive navigation

**Limitations**: 
- Title formatting options limited to maintain theme consistency
- Overview content strips colour formatting on paste
- Link styling constrained by theme design

</details>

-------------------------------------------------------------

## Icon

<details>
<summary>Click to view details:</summary>

The `Icon` component provides access to a comprehensive library of ligature-based icons to enhance content with visual elements and improve readability.

- It uses a custom ligature font system built from SVG sources, ensuring consistent rendering and scalability across devices and browsers.

- Users can select from hundreds of icons across multiple categories, customise colours and sizes, and integrate icons seamlessly with text content.

- The component automatically handles Canvas LMS accessibility checker compatibility when icons are used within headings.

### 1) Icon Selection & Customisation
Choose from an extensive icon library with comprehensive styling options.

**Editing Interface**: Click the Icon component to open the icon picker panel with visual icon browser and customisation controls.

**Available Options**:
- **Icon Library**: Browse categorised icon collections including Canvas LMS default icons and additional custom icons
- **Size Selection**: Choose from Auto (inherits text size), Small, Medium, Large, or Extra Large with visual size indicators
- **Colour Customisation**: Set custom icon colours with colour picker, automatically inheriting appropriate contrast based on background
- **Live Preview**: Real-time icon preview showing selected icon with applied styling before confirmation

**Expected Behaviour**:
- Icons scale proportionally based on size selection whilst maintaining crisp edges through ligature font rendering
- Colour changes apply immediately to preview and persist after selection
- Icon selection automatically closes picker and applies changes to document
- `Size Auto` option allows icons to scale naturally with surrounding text size

**Limitations**: 
- Limited to predefined icon library (custom uploads not supported). 
- The icon system currently supports approximately 1,220 total icons. When using Instructure default icons (approximately 300), custom icons are limited to about 900 additional icons. Exceeding this total limit will cause rendering failures for existing icons in the DOM.  

### 2) Text Integration & Accessibility
Seamlessly integrates icons with text content whilst maintaining accessibility standards.

**Editing Interface**: Icons are inserted inline with text and automatically adapt to content context.

**Available Options**:
- **Heading Integration**: When inserted on blank lines, automatically creates H2 heading structure for proper document hierarchy
- **Inline Placement**: Icons flow naturally with surrounding text and inherit baseline alignment
- **Canvas LMS Compatibility**: Mutation observer automatically detects when icons appear within headings (H1-H6) and adds `data-ignore-a11y-check` attribute to prevent accessibility checker from counting ligature text content as heading text
- **Context Awareness**: Icons adapt sizing and spacing based on surrounding content type (headings, paragraphs, lists)

**Expected Behaviour**:
- Icons maintain proper text flow and line height without disrupting paragraph spacing
- Automatic accessibility attribute management prevents Canvas accessibility checker conflicts with ligature text content
- Placeholder animation provides visual feedback when no icon is selected
- Icons preserve semantic meaning whilst adding visual enhancement to content

**Limitations**: 
- Icons are decorative elements and should always accompany descriptive text, cannot function as standalone interactive elements
- Accessibility attributes may need manual adjustment for complex content structures
- Ligature text content visible to screen readers requires proper context

</details>


-------------------------------------------------------------


## Image Cards

<details>
<summary>Click to view details:</summary>

The `Image Cards` component creates visual navigation grids using card-based layouts to highlight important links and facilitate quick visual navigation.

- It offers flexible grid layouts with responsive behaviour, supporting both image and icon-based cards with customisable themes and positioning options.

- Users can create multiple cards within a single component, configure individual card content including labels and links, and choose between overlay or subtitle presentation styles.

- The component is designed for high-priority navigation such as module lists, course sections, or important resource collections where visual appeal enhances user engagement.

### 1) Card Content & Layout Management
Configure individual cards and overall grid presentation with comprehensive customisation options.

**Editing Interface**: Click the Image Cards component to open the management panel, then select individual cards to edit their content or adjust overall layout settings.

**Available Options**:
- **Card Management**: Add, edit, delete, and reorder cards using the card list interface with drag-and-drop functionality
- **Content Type Selection**: Choose between image-based cards (with Canvas image search integration) or icon-based cards (with icon picker and colour customisation)
- **Individual Card Settings**:
  - Text labels with multi-line support (up to 100 characters)
  - URL configuration via Canvas content search for internal links or manual entry for external links
  - `Open in new tab` option for external navigation
- **Grid Layout Options**: Select from Small (flexible width), 3/4/5 Columns (fixed grid), or Large (expanded cards) layouts

**Expected Behaviour**:
- Cards automatically scale and reposition based on selected layout and screen size
- Image cards display background images with overlay text, icon cards show scalable vector icons with customisable colours
- Individual card selection highlights the active card for editing whilst maintaining visual preview
- Link integration provides automatic suggestions for Canvas course content

**Limitations**: 
- Maximum 100 characters per card label
- Limited to predefined grid layouts
- Custom card sizes not supported
- Image aspect ratios may be cropped to fit card containers

### 2) Visual Themes & Responsive Design
Control visual presentation and ensure optimal display across different screen sizes.

**Editing Interface**: Use the `Row Theme` and `Label Position` controls in the configuration panel to adjust visual styling.

**Available Options**:
- **Theme Selection**:
  - **Dark Theme**: Auto-set black / white text overlaid on images/icons with semi-transparent backgrounds for high contrast.  In `Dark + Icon` mode, the card background colour is filled with the chosen colour, whereas the icon colour is automatically set to black or white to ensure sufficient contrast.

  - **Light Theme**: Black text with white backgrounds in subtitle-style layout for clean presentation. In `Light + Icon` mode, the icon colour picker will show a warning on low-contrast palette options.
- **Label Positioning**: Choose "Overlay" (text over images) or "Below" (text beneath images) - only available for image-based cards
- **Responsive Behaviour**: Automatic grid adaptation based on container size using CSS container queries and media queries
- **Icon Customisation**: When using icon mode, select colours and adjust icon appearance for each card individually

**Expected Behaviour**:
- Grid layouts automatically collapse to fewer columns on smaller screens (5-col becomes 3-col on mobile, further reduces to 2-col and 1-col on very small screens)
- Dark theme ensures text readability across all image backgrounds with consistent overlay treatment
- Container queries provide smooth responsive transitions without content reflow issues
- Hover effects provide visual feedback with subtle scaling animations

**Limitations**: 
- Label positioning options restricted by theme selection
- Grid layouts follow predetermined responsive breakpoints
- Colour customisation only available for icon-based cards
- Overlay text contrast depends on background image selection

</details>

-------------------------------------------------------------

## Profiles

<details>
<summary>Click to view details:</summary>

The `Profiles` component creates professional profile displays for course instructors, teaching assistants, and other staff members with integrated Canvas user data and custom profile options.

- It automatically fetches course teaching staff from Canvas LMS (teachers, TAs, designers) with their existing profile information, photos, and bio data.

- Users can also create custom profiles for individuals not enrolled in the course, with full manual editing capabilities for all profile fields.

- The component provides flexible display options including customisable colours, bio visibility controls, and responsive card-based layouts.

### 1) Canvas Integration & Profile Management
Automatically imports course staff and manages individual profile configurations.

**Editing Interface**: Click the Profiles component to open the management panel with search functionality for Canvas users and profile editing options.

**Available Options**:
- **Canvas Staff Import**: Search and add course users automatically via Canvas API call to the course's user list, with specific enrollment type filters:
  - `enrollment_type[]=teacher` (Course instructors)
  - `enrollment_type[]=ta` (Teaching assistants) 
  - `enrollment_type[]=designer` (Course designers)
  - Query includes `avatar_url` and `bio` data fields
  - Limited to 100 users per course (`per_page=100`)
- **Retrieved Canvas Data**: Automatically imports available profile information including:
  - Full names (first_name, last_name, display name)
  - Email addresses
  - Bio information from Canvas user profiles  
  - Avatar/profile images when available
- **Custom Profile Creation**: Users can add non-Canvas individuals by typing a name and clicking "add a blank person" when no search results appear


**Expected Behaviour**:
- Canvas API automatically populates available staff from current course enrollment
- Profile photos link directly to Canvas avatar URLs when available
- Bio content imports from Canvas user bio fields with automatic paragraph formatting
- Custom profiles start with placeholder information that can be fully edited
- Search functionality filters Canvas users in real-time

**Limitations**: 
- Canvas integration requires course enrollment (teachers/TAs/designers only)
- API rate limits may affect large staff searches
- Imported Canvas data reflects current Canvas profile state
- Custom profiles not linked to Canvas accounts

### 2) Content Editing & Visual Customisation
Direct editing of profile information with comprehensive styling control.

**Editing Interface**: All profile content is directly editable within the displayed profiles, with additional styling options in the configuration panel.

**Available Options**:
- **Direct Content Editing**: Click directly on profile elements to edit:
  - Names and titles (plain text editing)
  - Position/role information  
  - Email addresses
  - Bio/overview content (rich HTML editing with formatting support)
- **Photo Management**: Click profile photos to open Canvas image search and replace with custom images
- **Visual Styling**: Colour picker for profile card backgrounds with automatic text contrast adjustment
- **Layout Control**: Bio sections can be shown/hidden per profile with optional section titles

**Expected Behaviour**:
- All text content updates immediately when edited and persists automatically
- Photo changes apply instantly with image search integration
- Colour validation ensures readable text contrast against selected background colours  
- Rich text bio editing supports paragraphs, formatting, and pasted content
- Variable Card Heights: Profile cards automatically adjust height based on content length - cards with longer names, positions, emails, or bio content will be taller than those with minimal information
- Mobile responsive layout maintains readability across screen sizes

**Limitations**: 
- Photo uploads limited to Canvas-accessible images
- Rich text editing may strip certain formatting on save
- Colour customisation applies to entire profile card
- Very long bio content may affect layout consistency

</details>

-------------------------------------------------------------

## Glossary

<details>
<summary>Click to view details:</summary>

The `Glossary` component creates a course-wide terminology system that automatically highlights defined terms throughout Canvas content and provides instant definitions via mouse-over tooltips and a dedicated glossary page.

- It automatically creates a dedicated glossary page and module in Canvas; and make terms accessible to learners through interactive in-text tooltips and a searchable glossary reference.

- Users can define custom course terms, enable institution-provided definitions, and import/export glossary data via CSV files with comprehensive editing tools.

- The component intelligently processes text content across Canvas pages and discussions, applying Unicode-aware term matching that handles multiple languages and complex character sets.

### 1) Glossary Setup & Canvas Integration
Automatically provisions glossary infrastructure within Canvas course structure.

**Editing Interface**: Access via the Design Blocks toolbar "Edit Glossary" option, which opens a dedicated glossary editor with term management capabilities.

**Available Options**:
- **Automatic Page Creation**: Creates a dedicated glossary page with invisible identifier tokens for system recognition
- **Module Integration**: Automatically creates and publishes a "Glossary" module at the end of the modules list, immediately visible to students
- **Canvas Permissions**: Requires users to have the `manage_wiki_create` and `manage_wiki_update` permissions for editing access
- **Institution Terms**: Option to enable pre-defined institutional glossary terms alongside custom course terms
- **CSV Import/Export**: Upload existing glossaries or download current terms for backup/sharing purposes

**Expected Behaviour**:
- Glossary page appears as a standard Canvas page within the created module
- Module positioning follows Canvas module ordering (appears at end of existing modules)
- The glossary page URL slug derives from the glossary title (converted to lowercase with hyphens), with Canvas automatically numbering duplicates if conflicts occur
- Institution terms integrate seamlessly with course-specific definitions
- CSV operations support standard "Term,Definition" column formats with header detection

**Limitations**: 
- Requires teacher/designer permissions in Canvas
- Limited to courses with module creation capabilities
- Page/module titles include invisible Unicode tokens for system identification 
- Glossary content stored within Canvas page body limits

### 2) Term Recognition & Display Behavior
Processes course content to identify and enhance glossary terms with interactive features.

**Editing Interface**: Terms appear automatically highlighted in course content with dotted underlines, providing hover tooltips and click interactions.

**Available Options**:
- **Display Locations**: Active within Canvas wiki page content areas (`div#wiki_page_show .user_content`), excluding interactive elements (links, buttons, form inputs, textareas, selects, iframes), code blocks, and Design Blocks components
- **Tooltip Interactions**: Mouse-hover to display definition tooltip, click to pin tooltip open, "Show/Hide Tooltips" toggle for user preference
- **End-of-Page Glossary**: Collapsible "Page Glossary" section appears at bottom of pages containing defined terms
- **Mobile Experience**: Bottom-sheet interface on mobile devices with backdrop blur effects for optimal readability
- **Term Matching Logic**: 
  - **Substring Handling**: Longer terms take precedence (e.g., "machine learning" matches before "machine" or "learning")
  - **Unicode Support**: Properly handles non-English characters, accents, and complex scripts using Unicode word boundaries
  - **Case Insensitive**: Matches terms regardless of capitalization in content

**Expected Behaviour**:
- Terms highlighted with dotted underlines throughout Canvas content
- Tooltip positioning uses floating UI for optimal placement within viewport
- Multiple terms on same page create comprehensive glossary list
- User toggle preference persists across browser sessions
- Excluded from processing: icons, code blocks, form inputs, buttons, and other interactive elements

**Limitations**: 
- Canvas Rich Content Editor (RCE) formatting may interfere with term recognition if applied directly to glossary text (due to inserted HTML tags that breaks the string)
- Tooltip display requires JavaScript enabled
- Mobile tooltip interactions differ from desktop hover behavior
- Very long definitions may extend beyond optimal tooltip sizes

### 3) Content Management & Advanced Features
Comprehensive term definition management with import/export capabilities and institutional integration.

**Editing Interface**: Dedicated glossary editor provides spreadsheet-like interface for bulk term management with drag-and-drop reordering.

**Available Options**:
- **Direct Term Management**: Add, edit, delete, and reorder terms with immediate save functionality
- **Definition Formatting**: Support for basic HTML formatting in definitions (paragraphs, emphasis, links)
- **Batch Operations**: 
  - CSV import with merge options (keep existing, replace conflicting, overwrite all)
  - CSV export for backup and sharing between courses
  - Drag-and-drop term reordering within editor interface
- **Institution Integration**: Toggle institutional terms on/off, preview institutional definitions, seamless integration with course-specific terms
- **Validation Systems**: Automatic detection of empty terms, duplicate term warnings, unsaved changes notifications

**Expected Behaviour**:
- Real-time editing with unsaved changes warning before page navigation
- CSV imports intelligently merge with existing terms using configurable strategies
- Institution terms appear alongside course terms in alphabetical order when enabled
- Definition HTML preserved for formatting while stripping problematic styling
- Editor autosaves progress and handles concurrent editing scenarios

**Limitations**: 
- Definition formatting limited to basic HTML elements
- CSV imports require proper `Term,Definition` column structure
- Very large glossaries may impact page load performance
- Concurrent editing by multiple users not fully supported
- Institutional terms cannot be edited at course level.

</details>