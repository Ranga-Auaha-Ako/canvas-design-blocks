import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import ButtonBarInner from "./buttonBar.svelte";
import { stateObject } from "src/desktop";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ButtonBarManager } from "./buttonBarManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import ButtonBarConfig from "./popup/buttonBarConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import { IconState, getIconState } from "$lib/icons/svelte/iconPicker";
import theme from "$lib/util/theme";
import { colord, type Colord } from "colord";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { Link, ModuleSearch } from "$lib/util/components/contentSearch/search";
import { courseEnv } from "$lib/util/courseEnv";

export enum ButtonBarTheme {
  Progress = "progress",
  Simple = "simple",
}
export const ValidThemes = Object.values(ButtonBarTheme);
export const DefaultTheme = ButtonBarTheme.Progress;

export enum ProgressState {
  Before = "moduleProgress--before",
  Current = "moduleProgress--current",
  After = "moduleProgress--after",
}
export const ValidProgressStates = Object.values(ProgressState);

export interface ButtonBarItem {
  moduleID?: string;
  label: string;
  url: string;
  icon?: IconState;
  hide?: boolean;
}

export interface ButtonBarData {
  items: ButtonBarItem[];
  theme: ButtonBarTheme;
  position?: number;
  color?: Colord;
}

const COURSE_ID = courseEnv?.COURSE_ID;
async function getModuleItems(): Promise<{
  items: ButtonBarItem[];
  modules: (Link & {
    id: string;
    page_url?: string;
    items?:
      | {
          id: number;
          published: boolean;
          page_url?: string;
          items?: { id: number; published: boolean; page_url?: string }[];
        }[]
      | undefined;
  })[];
}> {
  if (!COURSE_ID) return { items: [], modules: [] };
  const modules = new ModuleSearch(undefined, true);
  const items = await get(modules.data);
  return {
    items: items
      .filter((m) => m.published)
      .map((m, index) => {
        return {
          moduleID: m.id,
          label: m.name,
          url: m.url,
        };
      }),
    modules: items,
  };
}

class ButtonBarState implements SvelteState<ButtonBarData> {
  static defaultState: ButtonBarData = {
    theme: DefaultTheme,
    color: colord(theme.primary),
    position: 0,
    items: [],
  };
  state: Writable<ButtonBarData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;

  constructor(
    unsafeState: Partial<ButtonBarData> | undefined,
    node?: HTMLElement
  ) {
    let state: ButtonBarData = {
      ...ButtonBarState.defaultState,
      items: [],
    };
    if (unsafeState) {
      let btnTheme = ValidThemes.includes(unsafeState.theme as ButtonBarTheme)
        ? unsafeState.theme
        : DefaultTheme;
      state.theme = btnTheme || DefaultTheme;
      state.color = unsafeState.color
        ? colord(unsafeState.color)
        : colord(theme.primary);
      state.position = unsafeState.position || 0;
      const buttonURLs =
        node?.querySelectorAll<HTMLAnchorElement>(".buttonBar > a");
      if (unsafeState.items && buttonURLs) {
        unsafeState.items.forEach((item, index) => {
          let stateItem: ButtonBarItem = {
            moduleID: item.moduleID,
            label: item.label || `Module ${index + 1}`,
            url: "",
            icon: undefined,
            hide: !!item.hide,
          };
          // Update URL
          stateItem.url = buttonURLs[index]?.href || "";
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
  }
  get stateString() {
    const state = get(this.state);
    const { items, color, ...stateData } = state;
    return JSON.stringify({
      ...stateData,
      items: items.map(({ url, ...item }) => ({
        ...item,
      })),
      color: color?.toHex(),
    });
  }
}

export class ButtonBar extends SvelteElement<ButtonBarData> {
  selectionMethod: SvelteElement<ButtonBarData>["selectionMethod"] =
    "clickTinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CDB--ButtonBar"]);
  public popover: McePopover;
  static getItemIndex(state: ButtonBarData, id: string) {
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
    const inst = new this(state, editor, manager, node);
    this.syncModules(inst.SvelteState);
    return inst;
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public manager: ButtonBarManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(editor, manager, node, ButtonBarInner, ButtonBarState, id, highlight);

    // Set up popover
    this.popover = this.setupPopover(
      ButtonBarConfig,
      {
        buttonBar: this,
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

  static async syncModules(svelteState: SvelteState<ButtonBarData>) {
    const { items, modules } = await getModuleItems();
    svelteState.update((state) => {
      const pageID = courseEnv?.WIKI_PAGE?.url;
      if (!pageID) return state;
      const moduleWithPage = modules.findIndex((m) => {
        const page = m.items?.find(
          (i) => pageID && i.page_url === pageID && i.published
        );
        return page;
      });
      if (
        moduleWithPage > -1 &&
        (state.position === undefined || state.position === -1)
      )
        state.position = moduleWithPage;
      state.items = items.map((module) => {
        const existingItem = state.items.find(
          (item) => item.moduleID === module.moduleID
        );
        if (existingItem) {
          existingItem.label = module.label;
          existingItem.url = module.url;
          return existingItem;
        }
        return module;
      });
      return state;
    });
  }
}
