import { Writable, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import ButtonInner from "./button.svelte";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ButtonManager } from "./buttonManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import ButtonConfig from "./popup/buttonConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import {
  IconType,
  getIconState,
  icons,
} from "$lib/util/components/iconSearch/iconPicker";
import { IconState } from "$lib/util/components/iconSearch/iconElement.svelte";

export enum ButtonTheme {
  Default = "Button--default",
  Primary = "Button--primary",
  Secondary = "Button--secondary",
  Warning = "Button--warning",
  Danger = "Button--danger",
  Success = "Button--success",
}
export const ValidThemes = Object.values(ButtonTheme);
export const DefaultTheme = ButtonTheme.Default;

export enum ButtonSize {
  Mini = "Button--mini",
  Small = "Button--small",
  Default = "Button--size-default",
  Large = "Button--large",
}
export const ValidSizes = Object.values(ButtonSize);
export const DefaultSize = ButtonSize.Default;

export interface ButtonData {
  title: string;
  label: string;
  url: string;
  target: string;
  theme: ButtonTheme;
  size: ButtonSize;
  icon: IconState | undefined;
}

class ButtonState implements SvelteState<ButtonData> {
  static defaultState: ButtonData = {
    title: "",
    label: "Button Text",
    theme: DefaultTheme,
    size: DefaultSize,
    url: "#",
    target: "_self",
    icon: undefined,
  };
  state: Writable<ButtonData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(
    unsafeState: Partial<ButtonData> | undefined,
    node?: HTMLElement
  ) {
    let theme = ValidThemes.includes(unsafeState?.theme as ButtonTheme)
      ? unsafeState?.theme
      : DefaultTheme;
    let size = ValidSizes.includes(unsafeState?.size as ButtonSize)
      ? unsafeState?.size
      : DefaultSize;
    let icon = getIconState(unsafeState?.icon);
    let state: ButtonData = {
      title: unsafeState?.title || ButtonState.defaultState.title,
      label: unsafeState?.label || ButtonState.defaultState.label,
      theme: theme || DefaultTheme,
      size: size || DefaultSize,
      url: ButtonState.defaultState.url,
      target: unsafeState?.target || ButtonState.defaultState.target,
      icon: icon,
    };
    state.url =
      node?.querySelector("a.Button")?.getAttribute("href") ||
      ButtonState.defaultState.url;
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { url: _, ...buttonData } = state;
    return JSON.stringify(buttonData);
  }
}

export class Button extends SvelteElement<ButtonData> {
  selectionMethod: SvelteElement<ButtonData>["selectionMethod"] =
    "clickTinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["CDB--Button"]);
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
    public manager: ButtonManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(editor, manager, node, ButtonInner, ButtonState, id, highlight);

    // Set up popover
    this.popover = this.setupPopover(
      ButtonConfig,
      {
        button: this,
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
