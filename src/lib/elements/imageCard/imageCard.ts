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
import { sanitizeUrl } from "@braintree/sanitize-url";
import { IconState, getIconState } from "$lib/icons/svelte/iconPicker";
import { persisted } from "svelte-persisted-store";

export enum ImageCardTheme {
  Overlay = "imageCardTheme--overlay",
  Subtitle = "imageCardTheme--subtitle",
  Icon = "imageCardTheme--icon",
}
export const ValidThemes = Object.values(ImageCardTheme);
export const DefaultTheme = persisted(
  "cdb-imageCardTheme",
  ImageCardTheme.Overlay
);

export enum ImageCardSize {
  Small = "imageCardSize--small",
  Large = "imageCardSize--large",
  "Grid-3" = "imageCardSize--grid-3",
  "Grid-4" = "imageCardSize--grid-4",
  "Grid-5" = "imageCardSize--grid-5",
}
export const ValidSizes = Object.values(ImageCardSize);
export const DefaultSize = persisted(
  "cdb-imageCardSize",
  ImageCardSize["Grid-5"]
);

export interface CardData {
  label: string;
  link: string;
  image: string;
  id: string;
  icon?: IconState;
}

export interface RowData {
  cards: CardData[];
  size: ImageCardSize;
  theme: ImageCardTheme;
}

export interface LocalState {
  selectedCard: string;
  isSelected: boolean;
}

class CardRowState implements SvelteState<RowData> {
  static defaultState: RowData = {
    cards: [
      {
        label: "Insert Label Here",
        link: "#",
        image: "",
        id: nanoid(),
      },
    ],
    theme: get(DefaultTheme),
    size: get(DefaultSize),
  };
  state: Writable<RowData> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(unsafeState: Partial<RowData> | undefined, node?: HTMLElement) {
    let size = ValidSizes.includes(unsafeState?.size as ImageCardSize)
      ? unsafeState?.size
      : get(DefaultSize);
    let theme = ValidThemes.includes(unsafeState?.theme as ImageCardTheme)
      ? unsafeState?.theme
      : get(DefaultTheme);
    let state: RowData = {
      cards: [],
      size: size || get(DefaultSize),
      theme: theme || get(DefaultTheme),
    };
    if (unsafeState?.cards) {
      state.cards = unsafeState.cards.map((card) => {
        let icon = getIconState(card.icon);
        return {
          label: card.label || "",
          link: sanitizeUrl(card.link || "").replace(/^about:blank$/, ""),
          image: card.image || "",
          id: card.id || nanoid(),
          icon: icon,
        };
      });
    }
    if (state.cards.length === 0) {
      state.cards = [
        {
          label: "Insert Label Here",
          link: "#",
          image: "",
          id: nanoid(),
        },
      ];
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
  static getCardIndex(state: RowData, id: string) {
    return state.cards.findIndex((card) => card.id === id);
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
    public manager: ImageCardManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false,
    public localState = writable<LocalState>({
      selectedCard: "",
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
    node.addEventListener("pointerdown", (e) => {
      const target = e.target as HTMLElement;
      const inCard = target.closest<HTMLAnchorElement>("a.ImageCard");
      if (inCard) {
        const cardId = inCard.dataset.cdbId;
        if (cardId) {
          if (get(localState).selectedCard !== cardId)
            localState.update((state) => ({
              ...state,
              selectedCard: cardId,
            }));
        }
      }
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
