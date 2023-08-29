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
  public contenteditable = undefined;
  public static markupVersion = "1.0.0";
  public staticAttributes = {
    "data-cdb-version": ImageCardLabel.markupVersion,
  };

  public static staticStyle: Partial<CSSStyleDeclaration> = {};
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
    parentCard.childLabel = imageCardLabel;
    return imageCardLabel;
  }
  static create(state: stateObject, parentCard: ImageCard, editor: Editor) {
    const node = editor.dom.create("span", {}, "Insert label here..");
    Object.assign(node.style, this.staticStyle);

    parentCard.node.appendChild(node);

    // Create instance
    const imageCardLabel = new this(state, editor, node, parentCard, undefined);

    parentCard.childLabel = imageCardLabel;

    return imageCardLabel;
  }

  checkSelf() {
    this.stopObserving();
    if (!this.editor.getBody().contains(this.node) && this.parentCard) {
      this.delete();
      if (this.editor.getBody().contains(this.parentCard.node))
        ImageCardLabel.create(this.state, this.parentCard, this.editor);
      return;
    }
    this.startObserving();
  }
}
