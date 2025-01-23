import { Readable, Writable, derived, get, writable } from "svelte/store";
import MceElement from "../generic/mceElement";
import { stateObject } from "src/desktop";
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
  Dark = "imageCardTheme--overlay",
  Light = "imageCardTheme--subtitle",
  // Icon = "imageCardTheme--icon",
}
export const ValidThemes = Object.values(ImageCardTheme);
export const DefaultTheme = persisted(
  "cdb-imageCardTheme",
  ImageCardTheme.Dark
);

if (!ValidThemes.includes(get(DefaultTheme))) {
  // Migration step if icon
  //@ts-expect-error
  if (get(DefaultTheme) === "imageCardTheme--icon") {
    console.log("Migrating Image Card theme from icon to light.");
    DefaultTheme.set(ImageCardTheme.Light);
  } else {
    console.warn("Invalid default theme for Image Card. Setting to default.");
    DefaultTheme.set(ImageCardTheme.Dark);
  }
}

export enum ImageCardSize {
  Small = "imageCardSize--small",
  "5 Cols" = "imageCardSize--grid-5",
  "4 Cols" = "imageCardSize--grid-4",
  "3 Cols" = "imageCardSize--grid-3",
  Large = "imageCardSize--large",
}
export const ValidSizes = Object.values(ImageCardSize);
export const DefaultSize = persisted(
  "cdb-imageCardSize",
  ImageCardSize["5 Cols"]
);

export interface CardData {
  label: string;
  link: string;
  image: string;
  id: string;
  icon?: IconState;
  imageSettings?: {
    size: "fill" | "contain" | "cover" | "scale-down";
  };
  openInNewTab?: boolean;
  altText: string;
}

export const validFits = ["fill", "contain", "cover", "scale-down"];
export interface RowData {
  cards: CardData[];
  size: ImageCardSize;
  theme: ImageCardTheme;
  usesIcon?: boolean;
  labelOverlaid: boolean;
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
        imageSettings: {
          size: "cover",
        },
        openInNewTab: false,
        altText: "",
      },
    ],
    labelOverlaid: true,
    theme: get(DefaultTheme),
    size: get(DefaultSize),
    usesIcon: false,
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
      usesIcon: !!unsafeState?.usesIcon,
      labelOverlaid: unsafeState?.labelOverlaid ?? true,
    };
    // Migration step for cards from 2.12.0 and prior:
    //@ts-expect-error - comparision is for old version of type.
    if (unsafeState?.theme === "imageCardTheme--icon") {
      state.theme = ImageCardTheme.Light;
      state.usesIcon = true;
    }
    const cardLinks = node?.querySelectorAll<HTMLAnchorElement>("a.ImageCard");
    const cardImages =
      node?.querySelectorAll<HTMLImageElement>("img.ImageCardImage");
    if (unsafeState?.cards) {
      state.cards = unsafeState.cards.map((card, index) => {
        let icon = getIconState(card.icon);
        return {
          label: card.label || "",
          link: cardLinks?.[index]?.href || "#",
          image: cardImages?.[index]?.src || "",
          id: card.id || nanoid(),
          icon: icon,
          imageSettings: {
            size: validFits.includes(card?.imageSettings?.size || "")
              ? card?.imageSettings?.size!
              : "cover",
          },
          openInNewTab: card.openInNewTab ?? false,
          altText: card.altText ?? "",
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
          openInNewTab: false,
          altText: "",
          imageSettings: {
            size: "cover",
          },
        },
      ];
    }
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const { cards, ...stateData } = state;
    return JSON.stringify({
      ...stateData,
      cards: cards.map(({ link: _, image: __, ...card }) => ({
        ...card,
      })),
    });
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
