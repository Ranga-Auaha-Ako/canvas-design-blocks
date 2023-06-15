import { nanoid } from "nanoid";
import { get, writable, Writable } from "svelte/store";
import type { stateObject } from "src/main";
import type { Editor } from "tinymce";
import MceElement from "../generic/mceElement";
import ImageCardManager from "./imageCardManager";
import MceTextElement from "../generic/mceTextElement";
import { ImageCard } from "./imageCard";

export class ImageCardLabel extends MceTextElement {
  attributes: MceElement["attributes"] = new Map([]);
  public static markupVersion = "1.0.0";
  public staticAttributes = {
    "data-cdb-version": ImageCardLabel.markupVersion,
  };

  public static staticStyle: Partial<CSSStyleDeclaration> = {
    padding: "0.5em",
    lineHeight: "1.1",
    background: "#00000029",
    flexGrow: "1",
  };
  defaultClasses = new Set(["ImageCardLabel"]);

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public node: HTMLElement,
    public parentCard: ImageCard,
    public readonly id = nanoid()
  ) {
    super(node, editor, id);

    Object.entries(this.staticAttributes).forEach(([key, value]) => {
      if (node.getAttribute(key) !== value) {
        node.setAttribute(key, value);
      }
    });

    this.node.classList.add(...this.defaultClasses);

    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();
  }

  static import(
    state: stateObject,
    node: HTMLElement,
    parentCard: ImageCard,
    editor: Editor
  ) {
    if (node.dataset.cdbVersion !== this.markupVersion) {
      Object.assign(node.style, this.staticStyle);
    }
    const imageCardLabel = new ImageCardLabel(
      state,
      editor,
      node,
      parentCard,
      node.dataset.cdbId
    );
    return imageCardLabel;
  }
  static create(state: stateObject, parentCard: ImageCard, editor: Editor) {
    const node = editor.dom.create(
      "span",
      {},
      "This text should be at the bottom"
    );
    Object.assign(node.style, this.staticStyle);

    parentCard.node.appendChild(node);

    // Create instance
    return new this(state, editor, node, parentCard, undefined);
  }

  checkSelf() {
    this.stopObserving();
    if (!this.editor.getBody().contains(this.node)) {
      const newChild = ImageCardLabel.create(
        this.state,
        this.parentCard,
        this.editor
      );
      return this.delete();
    }
    this.startObserving();
  }
}
