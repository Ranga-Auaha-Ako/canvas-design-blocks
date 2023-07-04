import { nanoid } from "nanoid";
import type { stateObject } from "src/main";
import type { Editor } from "tinymce";
import MceElement from "../generic/mceElement";
import ImageCardManager from "./imageCardManager";
import { ImageCardLabel } from "./imageCardLabel";
import { ImageCardRow } from "./imageCardRow";
import { get, Writable } from "svelte/store";
import ImageCardConfig from "./popup/imageCardConfig.svelte";
import type { McePopover } from "../generic/popover/popover";

export class ImageCard extends MceElement {
  attributes: MceElement["attributes"] = new Map([]);
  selectionMethod: "TinyMCE" | "focus" = "TinyMCE";
  public static markupVersion = "1.0.0";
  public staticAttributes = {
    "data-cdb-version": ImageCard.markupVersion,
    contenteditable: "false",
  };
  public static staticStyle: Partial<CSSStyleDeclaration> = {
    width: "175px",
    height: "130px",
    display: "flex",
    alignItems: "flex-end",
    color: "white",
    textDecoration: "none",
    overflow: "hidden",
  };
  public popover: McePopover;
  public childLabel: ImageCardLabel;

  defaultClasses = new Set(["ImageCard", "uoa_shadowbox", "uoa_corners_8"]);

  public setImage(url: string) {
    const style = this.mergedAttributes.get("style");
    if (style) {
      (style as Writable<CSSStyleDeclaration>).update((style) => {
        // style.backgroundImage = `linear-gradient(to top, #000000a1, #00000029), url('${url}')`;
        // style.backgroundSize = "cover";
        style.backgroundPosition = "center";
        // style.setProperty("background", `center / cover`);
        style.setProperty("background-image", `url("${url}")`);
        // this.node.setAttribute(
        //   "style",
        //   `${style.cssText} background: center / cover; background-image: url('${url}');`
        // );
        return style;
      });
    }
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

    this.node.addEventListener("click", (e) => {
      e.preventDefault();
      // this.select();
      // this.delete();
      return false;
    });

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
        !this.popover.isActive && this.popover.show();
      } else {
        if (this.popover.isActive) {
          this.popover.hide();
        }
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
}
