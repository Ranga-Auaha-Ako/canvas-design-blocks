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

export enum HeaderTheme {
  Light = "HeaderTheme-light",
  Dark = "HeaderTheme-dark",
  Blur = "HeaderTheme-blur",
}

export const ValidThemes = Object.values(HeaderTheme);
export const DefaultTheme = HeaderTheme.Dark;

export interface HeaderData {
  title: string;
  overview: string;
  image: string;
  links: {
    title: string;
    url: string;
    id: string;
  }[];
  theme: HeaderTheme;
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
    let state: HeaderData = {
      title: unsafeState?.title || HeaderState.defaultState.title,
      overview: "",
      image: unsafeState?.image || HeaderState.defaultState.image,
      links:
        unsafeState?.links?.map((l) => ({
          title: l?.title || "",
          url: l?.url || "",
          id: l?.id || nanoid(),
        })) || HeaderState.defaultState.links,
      theme: theme || DefaultTheme,
    };
    state.overview =
      node?.querySelector(".headerOverview")?.innerHTML ||
      HeaderState.defaultState.overview;
    console.log(
      node?.querySelector(".headerOverview") ||
        HeaderState.defaultState.overview
    );
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { overview: _, ...headerData } = state;
    return JSON.stringify(headerData);
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
