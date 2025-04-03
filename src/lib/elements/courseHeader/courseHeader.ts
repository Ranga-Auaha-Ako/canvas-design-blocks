import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import CourseHeaderInner from "./courseHeaderInner.svelte";
import { stateObject } from "src/desktop";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { CourseHeaderManager } from "./courseHeaderManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import HeaderConfig from "./popup/headerConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { IconState, getIconState } from "$lib/icons/svelte/iconPicker";
import { colord, type Colord } from "colord";

export enum HeaderTheme {
  Light = "HeaderTheme-light",
  Dark = "HeaderTheme-dark",
  Blur = "HeaderTheme-blur",
  Modern = "HeaderTheme-modern",
}

export enum HeaderLevel {
  h2 = "h2",
  h3 = "h3",
  h4 = "h4",
}

export const ValidThemes = Object.values(HeaderTheme);
export const DefaultTheme = HeaderTheme.Modern;

export const ValidLevels = Object.values(HeaderLevel);
export const DefaultLevel = HeaderLevel.h2;

export interface HeaderData {
  title: string;
  overview: string;
  image: string;
  links: {
    title: string;
    url: string;
    id: string;
    target?: string;
    icon?: IconState;
  }[];
  theme: HeaderTheme;
  color?: Colord;          // text color
  backgroundColor?: Colord; // add this for background color
  level?: HeaderLevel;
  icon?: IconState;
}

class HeaderState implements SvelteState<HeaderData> {

  static defaultState: HeaderData = {
    title: "Course Header Title",
    overview: "<p>Welcome to this course! You can put any content you want here...</p>",
    image: "",
    links: [
      {
        title: "Link 1",
        url: "#",
        id: nanoid(),
      },
      {
        title: "Link 2",
        url: "#",
        id: nanoid(),
      },
    ],
    color: undefined,
    backgroundColor: undefined,
    theme: DefaultTheme,
    level: DefaultLevel,
  };

  state: Writable<HeaderData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;

  // initializing the state of a course header component
  // by taking an optional unsafeState object (which contains partial header data)
  // and a DOM node (which might be an existing HTML element) as inputs.
  constructor(
      unsafeState: Partial<HeaderData> | undefined,
      node?: HTMLElement
  ) {
    let theme = ValidThemes.includes(unsafeState?.theme as HeaderTheme)
        ? unsafeState?.theme
        : DefaultTheme;
    let level = ValidLevels.includes(unsafeState?.level as HeaderLevel)
        ? unsafeState?.level
        : DefaultLevel;

    const headerImage = node?.querySelector<HTMLImageElement>("img.headerImage");
    const linkURLs = node?.querySelectorAll<HTMLAnchorElement>(".headerLinks > a");

    // Get existing title element and its content/styles
    const existingTitleElement = node?.querySelector<HTMLElement>('.headerTitle');

    // Prioritize existing DOM content first to preserve unsaved styling
    const titleContent = existingTitleElement?.innerHTML || // get current DOM state with styling
                        unsafeState?.title || // fallback to passed-in state
                        HeaderState.defaultState.title; // last resort default

    let state: HeaderData = {
      title: titleContent,   // changed to a more informative name
      overview: "",
      image: headerImage?.src || HeaderState.defaultState.image,
      links:
          unsafeState?.links?.map((l, index) => {
            const url = linkURLs?.[index]?.href || "";
            let icon = getIconState(l.icon);
            return {
              title: l.title || "",
              url,
              id: l.id || nanoid(),
              icon: icon || undefined,
              target: l.target || undefined,
            };
          }) || HeaderState.defaultState.links,
      theme: theme || DefaultTheme,
      color: undefined,
      backgroundColor: undefined,
      level: level || DefaultLevel,
    };

    // Preserve existing styles if they exist
    if (existingTitleElement) {
      const computedStyle = window.getComputedStyle(existingTitleElement);
      state.title = existingTitleElement.innerHTML || state.title;

      // Preserve text color
      if (computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') {
        state.color = colord(computedStyle.color);
      }

      // Preserve background color
      if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        state.backgroundColor = colord(computedStyle.backgroundColor);
      }
    }

    // Handle colors from unsafeState if they exist
    if (unsafeState?.color) {
      state.color = colord(unsafeState.color);
    }
    if (unsafeState?.backgroundColor) {
      state.backgroundColor = colord(unsafeState.backgroundColor);
    }

    state.overview =
        node?.querySelector(".headerOverview")?.innerHTML ||
        HeaderState.defaultState.overview;
    let icon = getIconState(unsafeState?.icon);
    if (icon) state.icon = icon;
    this.state.set(state);
  }

  get stateString() {
    const state = get(this.state);
    const { overview: _o, color, links, ...headerData } = state;
    return JSON.stringify({
      ...headerData,
      color: color?.toHex() || undefined,
      links: links.map(({ url: _, ...item }) => ({
        ...item,
      })),
    });
  }
}


export class CourseHeader extends SvelteElement<HeaderData> {
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CourseHeader"]);
  public popover: McePopover;

  public static import(
    state: stateObject,
    node: HTMLElement,
    manager: any,
    editor: Editor
  ) {
    return new this(state, editor, manager, node);
  }
  public static create(
    state: stateObject,
    manager: any,
    atCursor: boolean,
    editor: Editor,
    highlight: boolean
  ) {
    const node = this.createInsertNode(atCursor, editor);
    return new this(state, editor, manager, node);
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public manager: CourseHeaderManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    // calling parent class and passing arguments to it
    super(editor, manager, node, CourseHeaderInner, HeaderState, id, highlight);

    // Capture current DOM state before setting up popover
    // This avoids popover overwriting unsaved changes & styling
    const titleElement = this.node.querySelector('.headerTitle');
    if (titleElement) {
        // Preserve the entire innerHTML which includes span elements with styling
        const currentTitle = titleElement.innerHTML;

        this.SvelteState.update(state => ({
            ...state,
            title: currentTitle  // This will preserve spans with color styling
        }));
    }

    // Set up popover
    this.popover = this.setupPopover(
      HeaderConfig,
      {
        courseHeader: this,
      },
      "top",
      {
        shift: {
          crossAxis: true,
        },
      }
    );
    this.isSelected.subscribe((selected) => {
      if (selected) {
        !this.popover.isActive && this.popover.show();
      } else {
        if (this.popover.isActive) {
          this.popover.hide();
        }
      }
    });
    this.setupObserver();
  }
}
