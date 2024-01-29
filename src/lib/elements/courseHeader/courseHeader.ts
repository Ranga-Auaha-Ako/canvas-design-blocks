import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import CourseHeaderInner from "./courseHeaderInner.svelte";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { CourseHeaderManager } from "./courseHeaderManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import HeaderConfig from "./popup/headerConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { IconState, getIconState } from "$lib/icons/svelte/iconPicker";

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
export const DefaultTheme = HeaderTheme.Dark;

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
  }[];
  theme: HeaderTheme;
  level?: HeaderLevel;
  icon?: IconState;
}

class HeaderState implements SvelteState<HeaderData> {
  static defaultState: HeaderData = {
    title: "Course Header Title",
    overview:
      "<p>Welcome to this course! You can put any content you want here...</p>",
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
    theme: DefaultTheme,
    level: DefaultLevel,
  };
  state: Writable<HeaderData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
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
    const headerImage =
      node?.querySelector<HTMLImageElement>("img.headerImage");
    const linkURLs =
      node?.querySelectorAll<HTMLAnchorElement>(".headerLinks > a");
    let state: HeaderData = {
      title: unsafeState?.title || HeaderState.defaultState.title,
      overview: "",
      image: headerImage?.src || HeaderState.defaultState.image,
      links:
        unsafeState?.links?.map((l, index) => {
          const url = linkURLs?.[index]?.href || "";
          return {
            title: l?.title || "",
            url,
            id: l?.id || nanoid(),
            target: l.target || undefined,
          };
        }) || HeaderState.defaultState.links,
      theme: theme || DefaultTheme,
      level: level || DefaultLevel,
    };
    state.overview =
      node?.querySelector(".headerOverview")?.innerHTML ||
      HeaderState.defaultState.overview;
    let icon = getIconState(unsafeState?.icon);
    if (icon) state.icon = icon;
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { overview: _o, links, ...headerData } = state;
    return JSON.stringify({
      ...headerData,
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
    super(editor, manager, node, CourseHeaderInner, HeaderState, id, highlight);

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
