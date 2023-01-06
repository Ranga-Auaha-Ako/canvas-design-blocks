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
    this.node.parentElement?.addEventListener(
      "keydown",
      this.keyHandler.bind(this)
    );
    this.editor.on("SelectionChange", this.selectionHandler.bind(this));
    // Add blank character to empty elements to prevent deletion
    this.selected.subscribe((selected) => {
      if (selected === this) {
        if (this.editor.dom.isEmpty(this.node)) {
          const newChild = this.clearContents();
          // const newChild = this.window.document.createTextNode("\uFEFF");
          this.editor.selection.select(newChild);
          // const sel = this.window.getSelection();
          // if (!sel || sel.type == "None") return;
          // sel.selectAllChildren(this.node);
          // const r = new Range();
          // r.selectNodeContents(newChild);
          // this.editor.selection.setRng(r);
        }
      }
    });
  }

  public clearContents() {
    // this.node.textContent = "\uFEFF";
    // this.node.innerHTML = "<br data-mce-bogus='1'>";
    const newChild = this.window.document.createTextNode("\uFEFF");
    this.node.replaceChildren(
      newChild,
      this.editor.dom.create("br", {
        "data-mce-bogus": "1",
      })
    );
    // this.node.appendChild(newChild);
    return newChild;
  }

  public async keyHandler(e: KeyboardEvent) {
    const willDelete = this.willDeleteOnBackspace();
    if (!willDelete) return true;
    // Handle user attempt to delete contents:
    if (e.key === "Backspace" || e.key === "Delete") {
      console.log("Prevented deletion of outer element, but clearing content");
      e.preventDefault();
      // this.node.textContent = "\uFEFF";
      this.clearContents();
      return false;
    }
  }

  public async selectionHandler() {
    const willDelete = this.willDeleteOnBackspace();
    if (!(willDelete === "selectAll")) return true;
    // // Shift the selection to the inner text
    // const r = new Range();
    // r.setStart(this.node.firstChild!, 0);
    // r.setEndBefore(newChild);
    // // r.selectNodeContents(this.node);
    // console.log("Danger?!", r, this.node);
    const newChild = this.window.document.createElement("span");
    const r = this.editor.selection.getRng();
    r.surroundContents(newChild);
    this.editor.selection.setRng(r);
    this.node.appendChild(this.window.document.createTextNode("\uFEFF"));
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

  public willDeleteOnBackspace(): false | "selectAll" | "empty" {
    const range = this.editor.selection.getRng();
    if (
      !(
        range.startContainer === range.endContainer &&
        this.node.contains(range.startContainer)
      )
    ) {
      // If the selection is not within the element we won't count it
      return false;
    }

    // If the element is empty, it will be deleted
    if (this.editor.dom.isEmpty(this.node)) return "empty";

    const elChildren = Array.from(this.node.childNodes);
    const validElementFinder = (c: ChildNode) =>
      (c.nodeType === Node.ELEMENT_NODE || c.nodeType === Node.TEXT_NODE) &&
      c.textContent &&
      c.textContent.length > 0;
    const firstChild = elChildren.find(validElementFinder);
    const lastChild = elChildren.slice().reverse().find(validElementFinder);
    // If the selection is not at the start of the element, there is other content before it
    if (!firstChild || range.startContainer !== firstChild) return false;
    // If the selection is not at the end of the element, there is other content after it
    if (!lastChild || range.endContainer !== lastChild) return false;

    // If the selection length is not the same as the element length, there is other content in the element
    if (
      range.startOffset !== 0 ||
      range.endOffset !== range.endContainer.textContent?.length
    ) {
      return false;
    }

    // If we've reached this point, the element is empty and the selection is at the start and end of the element
    return "selectAll";
  }
}
