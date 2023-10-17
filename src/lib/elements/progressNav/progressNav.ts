import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import ProgressNavInner from "./progressNav.svelte";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ProgressNavManager } from "./progressNavManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import ProgressNavConfig from "./popup/progressNavConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import {
  IconState,
  IconType,
  getIconState,
  icons,
} from "$lib/util/components/iconSearch/iconPicker";
import theme from "$lib/util/theme";
import { colord, type Colord } from "colord";
import { sanitizeUrl } from "@braintree/sanitize-url";

export enum ProgressNavSize {
  Default = "",
}
export const ValidSizes = Object.values(ProgressNavSize);
export const DefaultSize = ProgressNavSize.Default;

export enum ProgressState {
  Before = "moduleProgress--before",
  Current = "moduleProgress--current",
  After = "moduleProgress--after",
}
export const ValidProgressStates = Object.values(ProgressState);

export interface ProgressNavItem {
  moduleID?: string;
  state: ProgressState;
  label: string;
  url: string;
  icon?: IconState;
  color?: Colord;
}

export interface ProgressNavData {
  items: ProgressNavItem[];
  size: ProgressNavSize;
}

class ProgressNavState implements SvelteState<ProgressNavData> {
  static defaultState: ProgressNavData = {
    size: DefaultSize,
    items: [],
  };
  state: Writable<ProgressNavData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(
    unsafeState: Partial<ProgressNavData> | undefined,
    node?: HTMLElement
  ) {
    let state: ProgressNavData = {
      items: [],
      size: DefaultSize,
    };
    if (unsafeState) {
      let size = ValidSizes.includes(unsafeState.size as ProgressNavSize)
        ? unsafeState.size
        : DefaultSize;
      state.size = size || DefaultSize;
      if (unsafeState.items) {
        unsafeState.items.forEach((item, index) => {
          let stateItem: ProgressNavItem = {
            moduleID: item.moduleID,
            state: ProgressState.After,
            label: item.label || `Module ${index + 1}`,
            url: sanitizeUrl(item?.url || "").replace(/^about:blank$/, ""),
            color: colord(theme.primary),
            icon: undefined,
          };
          stateItem.state = ValidProgressStates.includes(
            item.state as ProgressState
          )
            ? item.state
            : ProgressState.After;
          stateItem.color = item.color
            ? colord(item.color)
            : colord(theme.primary);
          stateItem.icon = getIconState(item.icon);
          state.items.push(stateItem);
        });
      }
    }
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { items, ...stateData } = state;
    return JSON.stringify({
      ...stateData,
      items: items.map((item) => ({
        ...item,
        color: item.color?.toHex(),
      })),
    });
  }
}

export class ProgressNav extends SvelteElement<ProgressNavData> {
  selectionMethod: SvelteElement<ProgressNavData>["selectionMethod"] =
    "clickTinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CDB--ProgressNav"]);
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
    public manager: ProgressNavManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(
      editor,
      manager,
      node,
      ProgressNavInner,
      ProgressNavState,
      id,
      highlight
    );

    // Set up popover
    this.popover = this.setupPopover(
      ProgressNavConfig,
      {
        progressNav: this,
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
        // flip: {
        //   crossAxis: true,
        // },
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
