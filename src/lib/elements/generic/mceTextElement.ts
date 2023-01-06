import { nanoid } from "nanoid";
import { writable, Writable } from "svelte/store";
import type { Editor } from "tinymce";
import MceElement from "./mceElement";

/**
 * MCE Element with additional detection of text content. This subclass:
 * - Adds a two-way bound store for innerText
 * - Uses the TinyMCE-based selection method which is more reliable for text
 * - Modifies TinyMCE selection behaviour to prevent deleting the element when text inside is deleted
 */
export default abstract class MceTextElement extends MceElement {
  // - Inner text - will reflect what this.node has
  public innerText: Writable<string> | undefined;
  //  - Determines approach to detecting element selection
  public readonly selectionMethod: "TinyMCE" | "focus" = "TinyMCE";
  constructor(
    public node: HTMLElement,
    public editor: Editor = window.tinymce.activeEditor,
    public readonly id = nanoid()
  ) {
    // We need to observe for changes to text, so we need to modify the observer config
    const modifiedObserverConfig = {
      characterData: true,
      subtree: true,
    };
    super(
      node,
      editor,
      new Map([[node, modifiedObserverConfig]]),
      undefined,
      id
    );

    // Bind to keydown event to prevent deleting the element when text is deleted
    console.log(node);
    this.editor.dom.bind(node, "keydown", (e) => {
      if (!(e.key === "Backspace" || e.key === "Delete")) return true;
      console.log("Prevented deletion of text");
      if (this.node.innerText.length == 0) return true;
      e.preventDefault();
      return false;
    });
  }

  public observerFunc(mutations: MutationRecord[]) {
    // If the inner text has changed, update the store
    if (
      mutations.find(
        (m) => m.type === "characterData" || m.type === "childList"
      )
    ) {
      this.innerText?.set(this.node.innerText);
    }
    super.observerFunc(mutations);
  }

  public setupObserver() {
    super.setupObserver();

    // Watch for changes to the inner text and reflect back to node
    this.innerText = writable(this.node.innerText);
    this.innerText.subscribe((value) => {
      if (value !== this.node.innerText) {
        this.node.innerText = value;
      }
    });
  }
}
