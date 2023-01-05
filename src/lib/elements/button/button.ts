import MceElement, { MceElementStatics } from "$lib/tinymce/mceElement";
import { nanoid } from "nanoid";
import { stateObject } from "src/main";
import { writable } from "svelte/store";
import type { Editor } from "tinymce";
import { ButtonManager } from "./buttonManager";

export class Button extends MceElement {
  public static markupVersion = "1.0.0";
  attributes = new Map([
    ["href", writable("")],
    ["title", writable("")],
    ["target", writable("")],
  ]);
  variants = new Map([
    ["Primary", "Button--primary"],
    ["Secondary", "Button--secondary"],
    ["Green", "Button--success"],
    ["Orange", "Button--warning"],
    ["Red", "Button--danger"],
  ]);
  defaultClasses: Set<string> = new Set(["Button"]);

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public node: HTMLElement,
    public elementManager: ButtonManager,
    public readonly id = nanoid(),
    highlight: boolean = false
  ) {
    super(node, editor, undefined, [], id);

    // If desired, scroll to and highlight the grid
    if (highlight) {
      editor.getWin().scrollTo({
        top: this.node.offsetTop,
        behavior: "smooth",
      });
      editor.selection.select(this.node);
    }
  }

  public static import(
    state: stateObject,
    buttonRoot: HTMLElement,
    buttonManager: ButtonManager,
    editor: Editor = window.tinymce.activeEditor
  ) {
    const button = new this(
      state,
      editor,
      buttonRoot,
      buttonManager,
      buttonRoot.dataset.cgeId
    );
    return button;
  }

  public static create(
    state: stateObject,
    buttonManager: ButtonManager,
    atCursor = false,
    editor: Editor = window.tinymce.activeEditor,
    highlight = false
  ) {
    // Creates a new button at the specified location
    const buttonRoot = editor.dom.create(
      "a",
      {
        class: "Button",
        "data-cgb-version": Button.markupVersion,
        "data-cgb-content": "Simple",
      },
      "Button Text"
    );
    // Add button to page
    if (atCursor) {
      const insertNode = editor.selection.getNode();
      const inElement = insertNode.closest(`*[data-cgb-content="Simple"]`);
      if (inElement) {
        editor.dom.insertAfter(buttonRoot, inElement);
      } else {
        editor.dom.insertAfter(buttonRoot, insertNode);
      }
    }
    // Create button instance
    return new this(
      state,
      editor,
      buttonRoot,
      buttonManager,
      undefined,
      highlight
    );
  }

  checkChildren() {
    this.stopObserving();
    // Only text nodes are allowed as children of this.node
    const children = Array.from(this.node.childNodes);
    children.forEach((child) => {
      if (child.nodeType !== Node.TEXT_NODE) {
        if (child.textContent === null) return;
        this.node.replaceChild(
          this.node.ownerDocument.createTextNode(child.textContent),
          child
        );
      }
    });
    this.startObserving();
  }
  checkSelf() {
    throw new Error("Method not implemented.");
  }
}
