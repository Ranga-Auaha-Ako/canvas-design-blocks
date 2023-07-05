import { nanoid } from "nanoid";
import type { stateObject } from "src/main";
import { get, writable } from "svelte/store";
import type { Editor } from "tinymce";
import MceElement from "../generic/mceElement";
import { ImageCard } from "./imageCard";
import ImageCardManager from "./imageCardManager";
import type { McePopover } from "$lib/elements/generic/popover/popover";

export class ImageCardRow extends MceElement {
  selectionMethod: "TinyMCE" | "focus" = "TinyMCE";
  attributes: MceElement["attributes"] = new Map([]);
  public static markupVersion = "1.0.0";
  public staticAttributes = {
    "data-cdb-version": ImageCardRow.markupVersion,
    contenteditable: "false",
  };
  public static staticStyle: Partial<CSSStyleDeclaration> = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: "1em",
  };
  defaultClasses = new Set(["ImageCardRow", "cgb-component"]);
  cards = writable(new Map<string, ImageCard>());

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public imageCardManager: ImageCardManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(node, editor, undefined, undefined, id);

    Object.entries(this.staticAttributes).forEach(([key, value]) => {
      if (node.getAttribute(key) !== value) {
        node.setAttribute(key, value);
      }
    });

    this.node.classList.add(...this.defaultClasses);

    // If desired, scroll to and highlight the row
    if (highlight) {
      this.highlight();
    }

    // // Monitor selected state and show Editor when selected
    // this.isSelected.subscribe((selected) => {
    //   if (selected) {
    //     this.state.showInterface.set(true);
    //     this.state.configComponent.set({
    //       component: ImageCardConfig,
    //       props: {
    //         imageCard: this,
    //       },
    //     });
    //   } else {
    //     this.state.configComponent.update((c) => {
    //       if (c?.props.imageCard === this) return null;
    //       return c;
    //     });
    //   }
    // });

    this.node.addEventListener("click", (e) => {
      if (e.target === this.node) {
        this.createCard();
      }
    });

    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();
  }

  static import(
    state: stateObject,
    node: HTMLElement,
    imageCardManager: ImageCardManager,
    editor: Editor
  ) {
    if (node.dataset.cdbVersion !== this.markupVersion) {
      Object.assign(node.style, this.staticStyle);
    }
    const imageCardRow = new ImageCardRow(
      state,
      editor,
      imageCardManager,
      node,
      node.dataset.cdbId
    );
    imageCardRow.cards.update((cards) => {
      node.querySelectorAll(".ImageCard").forEach((cardNode) => {
        const card = ImageCard.import(
          state,
          cardNode as HTMLElement,
          imageCardRow,
          editor
        );
        cards.set(card.id, card);
      });
      return cards;
    });
    return imageCardRow;
  }

  static create(
    state: stateObject,
    cardRow: ImageCardRow,
    atCursor: boolean,
    editor: Editor,
    highlight: boolean
  ) {
    const node = editor.dom.create("div");
    Object.assign(node.style, this.staticStyle);
    // Add the rows to the page
    if (atCursor) {
      const insertNode = editor.selection.getNode();
      const inBlock = insertNode.closest(`*[data-cdb-content="Simple"]`);
      if (inBlock) {
        editor.dom.insertAfter(node, inBlock);
      } else if (
        insertNode.nodeName === "BODY" ||
        insertNode.closest("body") === null
      ) {
        editor.dom.add(editor.dom.getRoot(), node);
      } else if (!editor.dom.isBlock(insertNode)) {
        //  If the cursor is in a non-block element, insert the grid after the element
        editor.dom.insertAfter(node, insertNode);
      } else {
        editor.dom.add(insertNode, node);
      }
    } else editor.dom.add(editor.dom.getRoot(), node);

    const imageCardRow = new ImageCardRow(
      state,
      editor,
      cardRow.imageCardManager,
      node
    );

    // Create a card in the row
    imageCardRow.createCard();
    return imageCardRow;
  }

  public createCard() {
    const card = ImageCard.create(this.state, this, this.editor);
    this.addCard(card);
    return card;
  }

  public addCard(card: ImageCard) {
    this.cards.update((cards) => {
      cards.set(card.id, card);
      return cards;
    });
  }

  public removeCard(card: ImageCard) {
    this.cards.update((cards) => {
      cards.delete(card.id);
      return cards;
    });
  }

  checkChildren(): void {
    this.stopObserving();
    // Trigger a check on all rows
    get(this.cards).forEach((card) => card.checkChildren());
    this.startObserving();
  }
  checkSelf(): void {
    this.stopObserving();
    // Check if the row is empty
    if (this.node.children.length === 0) this.delete();
    // Check if the row is in the body
    if (!this.node.parentNode) {
      const position = get(this.imageCardManager).findIndex(
        (r) => r.id === this.id
      );
      if (position == -1) {
        // Uncaught delete!
        this.delete();
        return;
      }
      if (position > 0) {
        get(this.imageCardManager)[position - 1].node.insertAdjacentElement(
          "afterend",
          this.node
        );
      } else {
        get(this.imageCardManager)[position + 1].node.insertAdjacentElement(
          "beforebegin",
          this.node
        );
      }
    }
    this.startObserving();
  }
}
