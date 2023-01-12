import MceElement, {
  MceElementStatics,
} from "$lib/elements/generic/mceElement";
import { nanoid } from "nanoid";
import { stateObject } from "src/main";
import { get, writable } from "svelte/store";
import type { Editor } from "tinymce";
import MceTextElement from "../generic/mceTextElement";
import ButtonConfig from "./buttonConfig.svelte";
import { ButtonManager } from "./buttonManager";

export class Button extends MceTextElement {
  public static markupVersion = "1.0.0";
  public trackInnerText = true;
  public static staticAttributes = {
    "data-cgb-version": Button.markupVersion,
    "data-cgb-content": "Simple",
    contenteditable: "false",
  };
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
    super(node, editor, id);

    // If desired, scroll to and highlight the grid
    if (highlight) {
      this.highlight();
    }

    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();

    // Monitor selected state and show Button Editor when selected
    this.isSelected.subscribe((selected) => {
      if (selected) {
        console.log("Showing Interface for button");
        this.state.showInterface.set(true);
        this.state.configComponent.set({
          component: ButtonConfig,
          props: {
            button: this,
          },
        });
      } else {
        console.log("Hiding Interface for button", selected);
        this.state.configComponent.update((c) => {
          if (c?.props.button === this) return null;
          return c;
        });
      }
    });

    this.node.addEventListener("click", (e) => {
      e.preventDefault();
      this.select();
      return false;
    });
  }

  public delete() {
    if (get(this.isSelected)) {
      this.state.configComponent.update((c) => {
        if (c?.props.button === this) return null;
        return c;
      });
    }
    super.delete();
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
    Object.entries(Button.staticAttributes).forEach(([key, value]) => {
      if (buttonRoot.getAttribute(key) !== value) {
        buttonRoot.setAttribute(key, value);
      }
    });
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
      Button.staticAttributes,
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
    // const children = Array.from(this.node.childNodes);
    // children.forEach((child) => {
    //   if (child.nodeType !== Node.TEXT_NODE) {
    //     if (child.textContent === null) return;
    //     this.node.replaceChild(
    //       this.node.ownerDocument.createTextNode(child.textContent),
    //       child
    //     );
    //   }
    // });
    this.startObserving();
  }
  checkSelf() {
    if (!this.editor.getBody().contains(this.node)) {
      this.elementManager.remove(this);
    }
  }

  toString() {
    return "<Button/>";
  }
}
