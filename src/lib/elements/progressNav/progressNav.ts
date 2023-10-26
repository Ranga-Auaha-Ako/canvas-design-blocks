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
  getIconState,
} from "$lib/util/components/iconSearch/iconPicker";
import theme from "$lib/util/theme";
import { colord, type Colord } from "colord";
import { sanitizeUrl } from "@braintree/sanitize-url";
import {
  getIcon,
  searchModules,
} from "$lib/util/components/contentSearch/search";

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
  label: string;
  url: string;
  icon?: IconState;
  hide?: boolean;
}

export interface ProgressNavData {
  items: ProgressNavItem[];
  size: ProgressNavSize;
  position?: number;
  color?: Colord;
}

const COURSE_ID = window.ENV?.COURSE_ID;
async function getModuleItems(): Promise<{
  items: ProgressNavItem[];
  modules: Awaited<ReturnType<typeof searchModules>>;
}> {
  if (!COURSE_ID) return { items: [], modules: [] };
  const modules = await searchModules(undefined, true);
  return {
    items: modules
      .filter((m) => m.published)
      .map((m, index) => {
        return {
          moduleID: m.id,
          label: m.name,
          url: m.url,
        };
      }),
    modules,
  };
}

class ProgressNavState implements SvelteState<ProgressNavData> {
  static defaultState: ProgressNavData = {
    size: DefaultSize,
    color: colord(theme.primary),
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
      state.color = unsafeState.color
        ? colord(unsafeState.color)
        : colord(theme.primary);
      state.position = unsafeState.position;
      if (unsafeState.items) {
        unsafeState.items.forEach((item, index) => {
          let stateItem: ProgressNavItem = {
            moduleID: item.moduleID,
            label: item.label || `Module ${index + 1}`,
            url: sanitizeUrl(item?.url || "").replace(/^about:blank$/, ""),
            icon: undefined,
            hide: !!item.hide,
          };
          stateItem.icon = getIconState(item.icon);
          const existingIndex = state.items.findIndex(
            (i) => i.moduleID === stateItem.moduleID
          );
          if (existingIndex > -1) {
            state.items[existingIndex] = stateItem;
          } else {
            state.items.push(stateItem);
          }
        });
      }
    }
    this.state.set(state);
    const foundModules = getModuleItems();
    foundModules.then(({ items, modules }) => {
      this.state.update((state) => {
        const pageID = window.ENV?.WIKI_PAGE?.url;
        const moduleWithPage = modules.findIndex((m) => {
          const page = m.items?.find(
            (i) => pageID && i.page_url === pageID && i.published
          );
          return page;
        });
        if (moduleWithPage > -1 && state.position === undefined)
          state.position = moduleWithPage;
        state.items = items.map((module) => {
          const existingItem = state.items.find(
            (item) => item.moduleID === module.moduleID
          );
          if (existingItem) {
            return existingItem;
          }
          return module;
        });
        return state;
      });
    });
  }
  get stateString() {
    const state = get(this.state);
    const { items, color, ...stateData } = state;
    return JSON.stringify({
      ...stateData,
      items: items.map((item) => ({
        ...item,
      })),
      color: color?.toHex(),
    });
  }
}

export class ProgressNav extends SvelteElement<ProgressNavData> {
  selectionMethod: SvelteElement<ProgressNavData>["selectionMethod"] =
    "clickTinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CDB--ProgressNav"]);
  public popover: McePopover;
  static getItemIndex(state: ProgressNavData, id: string) {
    return state.items.findIndex((item) => item.moduleID === id);
  }

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
