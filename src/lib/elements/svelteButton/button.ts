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
  IconState,
  IconType,
  getIconState,
  icons,
} from "$lib/icons/svelte/iconPicker";
import theme from "$lib/util/theme";
import { colord, type Colord } from "colord";
import { sanitizeUrl } from "@braintree/sanitize-url";

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
  Default = "",
  Large = "Button--large",
}
export const ValidSizes = Object.values(ButtonSize);
export const DefaultSize = ButtonSize.Default;

export interface ButtonData {
  title: string;
  label: string;
  url: string;
  target: string;
  size: ButtonSize;
  icon: IconState | undefined;
  color?: Colord;
  textColor?: Colord;
  fullWidth?: boolean;
}

export interface CanvasButtonData extends ButtonData {
  theme: ButtonTheme;
}

class ButtonState implements SvelteState<ButtonData> {
  static defaultState: ButtonData = {
    title: "",
    label: "Button Text",
    color: colord(theme.primary),
    textColor: colord("#fff"),
    size: DefaultSize,
    url: "#",
    target: "_self",
    icon: undefined,
    fullWidth: false,
  };
  state: Writable<ButtonData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(
    unsafeState: Partial<ButtonData | CanvasButtonData> | undefined,
    node?: HTMLElement
  ) {
    let state: ButtonData = {
      title: ButtonState.defaultState.title,
      label: ButtonState.defaultState.label,
      size: DefaultSize,
      url: ButtonState.defaultState.url,
      target: ButtonState.defaultState.target,
      color: ButtonState.defaultState.color,
      textColor: ButtonState.defaultState.textColor,
      fullWidth: ButtonState.defaultState.fullWidth,
      icon: undefined,
    };
    if (unsafeState) {
      let color;
      if ("theme" in unsafeState) {
        let foundTheme = ValidThemes.includes(unsafeState.theme as ButtonTheme)
          ? unsafeState.theme
          : DefaultTheme;
        switch (foundTheme) {
          case ButtonTheme.Secondary:
            color = colord(theme.secondary);
            break;
          case ButtonTheme.Warning:
            color = colord("#fc5e13");
            break;
          case ButtonTheme.Danger:
            color = colord("#e0061f");
            break;
          case ButtonTheme.Success:
            color = colord("#0b874b");
            break;
          default:
            color = colord(theme.primary);
        }
      } else {
        color = unsafeState.color
          ? colord(unsafeState.color)
          : ButtonState.defaultState.color;
      }
      let size = ValidSizes.includes(unsafeState.size as ButtonSize)
        ? unsafeState.size
        : DefaultSize;
      let icon = getIconState(unsafeState.icon);
      state = {
        title: unsafeState.title || ButtonState.defaultState.title,
        label: unsafeState.label || ButtonState.defaultState.label,
        color: color,
        textColor: unsafeState.textColor
          ? colord(unsafeState.textColor)
          : ButtonState.defaultState.textColor,
        size: size || DefaultSize,
        url: ButtonState.defaultState.url,
        target: unsafeState.target || ButtonState.defaultState.target,
        fullWidth: unsafeState.fullWidth || ButtonState.defaultState.fullWidth,
        icon: icon,
      };
      state.url =
        node?.querySelector("a")?.getAttribute("href") ||
        node?.querySelector("a")?.dataset.mceHref ||
        ButtonState.defaultState.url;
    }
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { url: _, color, textColor, ...buttonData } = state;
    return JSON.stringify({
      ...buttonData,
      color: color?.toHex(),
      textColor: textColor?.toHex(),
    });
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

    this.SvelteState.subscribe((state) => {
      // We need to mark full width buttons as such
      if (state.fullWidth) {
        this.node.classList.add("fullWidth");
      } else {
        this.node.classList.remove("fullWidth");
      }
    });
    this.setupObserver();
  }
}
