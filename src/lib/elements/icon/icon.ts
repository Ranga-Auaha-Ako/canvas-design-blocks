import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import IconInner from "./icon.svelte";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { IconManager } from "./iconManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import IconConfig from "./popup/iconConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import { getIconState } from "$lib/icons/svelte/iconPicker";
import theme from "$lib/util/theme";
import { colord, type Colord } from "colord";
import { IconState as IconDataState } from "$lib/icons/svelte/iconPicker";

export enum IconTheme {
  Default = "Icon--default",
}
export const ValidThemes = Object.values(IconTheme);
export const DefaultTheme = IconTheme.Default;

export interface IconData {
  theme: IconTheme;
  icon?: IconDataState;
  color?: Colord;
}

export interface CanvasIconData extends IconData {
  theme: IconTheme;
}

class IconState implements SvelteState<IconData> {
  static defaultState: IconData = {
    theme: DefaultTheme,
    color: colord(theme.primary),
    icon: undefined,
  };
  public staticAttributes = {
    "data-cdb-version": SvelteElement.markupVersion,
  };
  state: Writable<IconData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(unsafeState: Partial<IconData> | undefined, node?: HTMLElement) {
    let state: IconData = {
      theme: DefaultTheme,
      color: colord(theme.primary),
      icon: undefined,
    };
    if (unsafeState) {
      let theme = ValidThemes.includes(unsafeState.theme as IconTheme)
        ? unsafeState.theme
        : DefaultTheme;
      state = {
        theme: theme || DefaultTheme,
        color: IconState.defaultState.color,
        icon: undefined,
      };
      state.color = unsafeState.color
        ? colord(unsafeState.color)
        : IconState.defaultState.color;
      let icon = getIconState(unsafeState.icon);
      state.icon = icon;
    }
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { color, ...iconData } = state;
    return JSON.stringify({
      ...iconData,
      color: color?.toHex(),
    });
  }
}

export class Icon extends SvelteElement<IconData> {
  selectionMethod: SvelteElement<IconData>["selectionMethod"] = "clickTinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CDB--Icon"]);
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
    const node = this.createInsertNode(atCursor, editor, true);
    return new this(state, editor, manager, node);
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public manager: IconManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(editor, manager, node, IconInner, IconState, id, highlight);

    // Set up popover
    this.popover = this.setupPopover(
      IconConfig,
      {
        icon: this,
      },
      "top",
      {
        shift: {
          crossAxis: true,
        },
        autoPlacement: {
          allowedPlacements: ["top", "bottom", "right"],
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
