import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import __NameInner from "./__name.svelte";
import { stateObject } from "src/desktop";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { __NameManager } from "./__nameManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import __NameConfig from "./popup/__nameConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import { getIconState } from "$lib/icons/svelte/iconPicker";
import theme from "$lib/util/theme";
import { colord, type Colord } from "colord";

export enum __NameTheme {
  Default = "__Name--default",
}
export const ValidThemes = Object.values(__NameTheme);
export const DefaultTheme = __NameTheme.Default;

export interface __NameData {
  title: string;
  url: string;
  theme: __NameTheme;
}

export interface Canvas__NameData extends __NameData {
  theme: __NameTheme;
}

class __NameState implements SvelteState<__NameData> {
  static defaultState: __NameData = {
    title: "",
    url: "#",
    theme: DefaultTheme,
  };
  state: Writable<__NameData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(
    unsafeState: Partial<__NameData> | undefined,
    node?: HTMLElement
  ) {
    let state: __NameData = {
      title: __NameState.defaultState.title,
      theme: DefaultTheme,
      url: __NameState.defaultState.url,
    };
    if (unsafeState) {
      let theme = ValidThemes.includes(unsafeState.theme as __NameTheme)
        ? unsafeState.theme
        : DefaultTheme;
      state = {
        title: unsafeState.title || __NameState.defaultState.title,
        theme: theme || DefaultTheme,
        url: __NameState.defaultState.url,
      };
      state.url =
        node?.querySelector("a")?.getAttribute("href") ||
        node?.querySelector("a")?.dataset.mceHref ||
        __NameState.defaultState.url;
    }
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { url: _, ...__nameData } = state;
    return JSON.stringify({
      ...__nameData,
    });
  }
}

export class __Name extends SvelteElement<__NameData> {
  selectionMethod: SvelteElement<__NameData>["selectionMethod"] =
    "clickTinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CDB--__Name"]);
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
    public manager: __NameManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(editor, manager, node, __NameInner, __NameState, id, highlight);

    // Set up popover
    this.popover = this.setupPopover(
      __NameConfig,
      {
        __name: this,
      },
      "top",
      {
        shift: {
          crossAxis: true,
        },
        autoPlacement: {
          allowedPlacements: ["top", "bottom"],
        },
        offset: 15,
      },
      {
        showArrow: true,
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
