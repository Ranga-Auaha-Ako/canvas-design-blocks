import { nanoid } from "nanoid";
import type { stateObject } from "src/main";
import type { Editor } from "tinymce";
import MceElement from "../generic/mceElement";
import ImageCardManager from "./imageCardManager";
import { ImageCardLabel } from "./imageCardLabel";
import { ImageCardRow } from "./imageCardRow";
import { get, writable, Writable } from "svelte/store";
import ImageCardConfig from "./popup/imageCardConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import writableDerived from "svelte-writable-derived";

export class ImageCard extends MceElement {
  attributes: MceElement["attributes"] = new Map([["href", writable("")]]);
  selectionMethod: "TinyMCE" | "focus" | "clickTinyMCE" = "clickTinyMCE";
  public static markupVersion = "1.0.0";
  public staticAttributes = {
    "data-cdb-version": ImageCard.markupVersion,
    // contenteditable: "false",
    // tabindex: "0",
  };
  public static staticStyle: Partial<CSSStyleDeclaration> = {};
  public popover: McePopover;
  public childLabel: ImageCardLabel;

  defaultClasses = new Set(["ImageCard"]);

  public setImage(url: string) {
    const style = this.mergedAttributes.get("style");
    this.node.setAttribute("style", `background-image: url('${url}');`);
    // if (style) {
    //   (style as Writable<CSSStyleDeclaration>).update((style) => {
    //     // style.backgroundImage = `linear-gradient(to top, #000000a1, #00000029), url('${url}')`;
    //     // style.backgroundSize = "cover";
    //     // style.backgroundPosition = "center";
    //     // style.setProperty("background", `center / cover`);
    //     // style.setProperty("background-image", `url('${url}')`);
    //     // this.node.setAttribute(
    //     //   "style",
    //     //   `${style.cssText} background: center / cover; background-image: url('${url}');`
    //     // );
    //     style.cssText = `background-image: url('${url}');`;
    //     return style;
    //   });
    // }
  }

  public openImageSelector() {
    // TODO: Open image selector
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public node: HTMLElement,
    public cardRow: ImageCardRow,
    public readonly id = nanoid()
  ) {
    super(node, editor, undefined, undefined, id);

    Object.entries(this.staticAttributes).forEach(([key, value]) => {
      if (node.getAttribute(key) !== value) {
        node.setAttribute(key, value);
      }
    });

    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();

    // Set up popover
    this.popover = this.setupPopover(
      ImageCardConfig,
      {
        imageCard: this,
      },
      "top"
    );
    this.isSelected.subscribe((selected) => {
      if (selected) {
        this.node.dataset.mceSelected = "cbe";
        !this.popover.isActive && this.popover.show();
        cardRow.select(this);
      } else {
        delete this.node.dataset.mceSelected;
        if (this.popover.isActive) {
          this.popover.hide();
        }
        cardRow.deselect(this);
      }
    });
    cardRow.selected.subscribe((sel) => {
      if (!sel.has(this) && get(this.isSelected)) {
        this.deselect();
      }
    });

    (this.attributes.get("href") as Writable<string>).subscribe((href) => {
      if (this.node.dataset.mceHref !== href) {
        this.node.dataset.mceHref = href;
      }
    });

    // Create or import label
    const childEl = node.querySelector("span.ImageCardLabel");
    let child: ImageCardLabel;
    if (childEl) {
      child = ImageCardLabel.import(
        state,
        childEl as HTMLElement,
        this,
        editor
      );
    } else {
      child = ImageCardLabel.create(state, this, editor);
    }
    this.childLabel = child;
  }

  static import(
    state: stateObject,
    node: HTMLElement,
    cardRow: ImageCardRow,
    editor: Editor
  ) {
    if (node.dataset.cdbVersion !== this.markupVersion) {
      Object.assign(node.style, this.staticStyle);
    }
    const imageCard = new ImageCard(
      state,
      editor,
      node,
      cardRow,
      node.dataset.cdbId
    );
    return imageCard;
  }

  static create(state: stateObject, cardRow: ImageCardRow, editor: Editor) {
    const node = editor.dom.create("a", { href: "#" });
    Object.assign(node.style, this.staticStyle);
    editor.dom.add(cardRow.node, node);
    // Create instance
    const imageCard = new this(state, editor, node, cardRow, undefined);

    return imageCard;
  }
  checkChildren() {
    this.stopObserving();
    // TODO: Check child
    this.startObserving();
  }
  checkSelf() {
    this.stopObserving();
    if (!this.editor.getBody().contains(this.node)) {
      this.cardRow.removeCard(this);
    }
    this.startObserving();
  }

  delete() {
    this.popover.hide();
    super.delete();
  }
}
