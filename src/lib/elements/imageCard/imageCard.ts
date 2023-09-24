import { Readable, Writable, derived, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ImageCardManager } from "./imageCardManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import type { McePopover } from "../generic/popover/popover";
import ImageCardInner from "./imageCardInner.svelte";
import ImageCardConfig from "./popup/imageCardConfig.svelte";

export enum ImageCardTheme {
  Overlay = "imageCardTheme--overlay",
  Subtitle = "imageCardTheme--subtitle",
}
export const ValidThemes = Object.values(ImageCardTheme);
export const DefaultTheme = ImageCardTheme.Overlay;

export enum ImageCardSize {
  Small = "imageCardSize--small",
  Large = "imageCardSize--large",
  "Grid-3" = "imageCardSize--grid-3",
  "Grid-4" = "imageCardSize--grid-4",
  "Grid-5" = "imageCardSize--grid-5",
}
export const ValidSizes = Object.values(ImageCardSize);
export const DefaultSize = ImageCardSize.Small;

export interface CardData {
  label: string;
  link: string;
  image: string;
}

export interface RowData {
  cards: CardData[];
  size: ImageCardSize;
  theme: ImageCardTheme;
}

export interface LocalState {
  selectedCard: number;
  isSelected: boolean;
}

class CardRowState implements SvelteState<RowData> {
  static defaultState: RowData = {
    cards: [
      {
        label: "Insert Label Here",
        link: "#",
        image: "",
      },
    ],
    theme: DefaultTheme,
    size: DefaultSize,
  };
  state: Writable<RowData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(unsafeState: Partial<RowData> | undefined, node?: HTMLElement) {
    let size = ValidSizes.includes(unsafeState?.size as ImageCardSize)
      ? unsafeState?.size
      : DefaultSize;
    let theme = ValidThemes.includes(unsafeState?.theme as ImageCardTheme)
      ? unsafeState?.theme
      : DefaultTheme;
    let state: RowData = {
      cards: [],
      size: size || DefaultSize,
      theme: theme || DefaultTheme,
    };
    if (unsafeState?.cards) {
      state.cards = unsafeState.cards.map((card) => {
        return {
          label: card.label || "",
          link: card.link || "",
          image: card.image || "",
        };
      });
    }
    if (state.cards.length === 0) {
      state.cards = CardRowState.defaultState.cards;
    }
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { ...rowData } = state;
    return JSON.stringify(rowData);
  }
}

export class ImageCard extends SvelteElement<RowData, LocalState> {
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["ImageCards"]);
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
    public manager: ImageCardManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false,
    public localState = writable<LocalState>({
      selectedCard: 0,
      isSelected: false,
    })
  ) {
    super(
      editor,
      manager,
      node,
      ImageCardInner,
      CardRowState,
      id,
      highlight,
      undefined,
      localState
    );
    // this.customEvents = new Map([["selectCard", this.c]]);
    this.isSelected.subscribe((selected) => {
      localState.update((state) => ({
        ...state,
        isSelected: selected,
      }));
    });

    // Set up popover
    this.popover = this.setupPopover(
      ImageCardConfig,
      {
        imageCard: this,
        localState,
      },
      "top"
    );
    let selectedCard: HTMLAnchorElement | undefined;
    this.localState.subscribe((state) => {
      if (get(this.isSelected)) {
        const selectedIndex = state.selectedCard;
        const newSelectedCard =
          this.node.querySelector<HTMLAnchorElement>(
            `.ImageCards--row > a.ImageCard:nth-child(${selectedIndex + 1})`
          ) || undefined;
        if (selectedCard !== newSelectedCard) {
          console.log(
            "Showing popover",
            selectedIndex,
            newSelectedCard,
            this.node
          );
          if (newSelectedCard) this.popover.setTarget(newSelectedCard);
          selectedCard = newSelectedCard;
        }
      }
    });
    this.isSelected.subscribe((selected) => {
      if (selected) {
        if (!this.popover.isActive) {
          this.popover.show();
        }
      } else {
        if (this.popover.isActive) {
          this.popover.hide();
        }
      }
    });
    this.setupObserver();
  }
}
