import { nanoid } from "nanoid";
import { get, Unsubscriber, writable, Writable } from "svelte/store";
import type { Editor } from "tinymce";
import MceElement from "./mceElement";

/**
 * MCE Element with additional detection of text content. This subclass:
 * - Adds a two-way bound store for innerText
 * - Uses the TinyMCE-based selection method which is more reliable for text
 * - Modifies TinyMCE selection behaviour to prevent deleting the element when text inside is deleted
 */
export default abstract class MceTextElement extends MceElement {
  /**
   * Inner text - will reflect what this.node has
   */
  public innerText?: Writable<string>;
  /**
   * The inner node - editable by the user (given contenteditable="true")
   */
  public innerNode: Writable<HTMLElement | undefined> = writable();
  public readonly selectionMethod = "TinyMCE";

  /**
   * Get or create the inner node for an element, which is required for text content to be editable.
   *
   * @param outerNode The outer node to search within
   * @param innerNode Optionally, a candidate inner node
   * @returns The inner node, and a boolean indicating whether it was newly created
   */
  public getOrCreateInnerNode(
    outerNode: HTMLElement = this.node,
    innerNode: HTMLElement | undefined = get(this.innerNode)
  ): [HTMLElement, boolean] {
    this.stopObserving();
    let isNew = false;
    let foundInnerNode: HTMLElement;
    if (!innerNode || innerNode.parentNode !== outerNode) {
      foundInnerNode = outerNode.querySelector(
        ":scope > span.cgb-el-inner"
      ) as HTMLDivElement;
      if (!foundInnerNode) {
        foundInnerNode = this.editor.dom.create("span", {
          contenteditable: true,
          class: "cgb-el-inner",
        });
        outerNode.appendChild(foundInnerNode);
      }
      isNew = foundInnerNode !== innerNode;
    } else {
      foundInnerNode = innerNode;
    }
    this.editor.dom.setAttrib(foundInnerNode, "contenteditable", "true");

    // Move any other children into the inner node - we don't need them
    [...outerNode.childNodes].forEach((n) => {
      if (
        n !== foundInnerNode &&
        n.nodeType !== Node.COMMENT_NODE &&
        (n.nodeType !== Node.ELEMENT_NODE ||
          (n as HTMLElement)?.dataset.cgbNoMove !== "true") // Allow some nodes to be left in place if the author wants)
      ) {
        console.log("Moving incorrectly placed element into inner node", n);
        (foundInnerNode as HTMLElement).appendChild(n);
      }
      this.startObserving();
    });
    // If the element is empty, reset it
    if (MceElement.isEmpty(foundInnerNode)) {
      foundInnerNode.innerHTML = "";
      // this.editor.dom.add(
      //   outerNode,
      //   "div",
      //   {
      //     class: "cgb-empty-placeholder",
      //     style: "display: none",
      //     contenteditable: false,
      //   },
      //   "&nbsp;"
      // );
      const target = this.editor.dom.add(foundInnerNode, "br", {
        "data-mce-bogus": "1",
      });
      // Move cursor to the new paragraph if it's inside the element
      if (
        this.editor.selection.getNode().closest("[data-cgb-content]") ===
        outerNode
      ) {
        this.editor.selection.setCursorLocation(target, 0);
      }
    }
    this.innerNode.set(foundInnerNode);
    return [foundInnerNode, isNew];
  }
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
      new Map([[node, { ...modifiedObserverConfig, name: "" }]]),
      undefined,
      id
    );

    // Bind to keydown event to prevent deleting the element when text is deleted
    console.log(node);
    this.node.parentElement?.addEventListener(
      "keydown",
      this.keyHandler.bind(this)
    );

    // this.editor.on("SelectionChange", this.selectionHandler.bind(this));
    // Add blank character to empty elements to prevent deletion
    // this.selected.subscribe((selected) => {
    //   if (selected === this) {
    //     if (this.editor.dom.isEmpty(this.node)) {
    //       const newChild = this.clearContents();
    //       // const newChild = this.window.document.createTextNode("\uFEFF");
    //       this.editor.selection.select(newChild);
    //       // const sel = this.window.getSelection();
    //       // if (!sel || sel.type == "None") return;
    //       // sel.selectAllChildren(this.node);
    //       // const r = new Range();
    //       // r.selectNodeContents(newChild);
    //       // this.editor.selection.setRng(r);
    //     }
    //   }
    // });
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

  public keyHandler(e: KeyboardEvent) {
    const willDelete = this.willDeleteOnBackspace();
    if (!willDelete) return true;
    // Handle user attempt to delete contents:
    if (e.key === "Backspace" || e.key === "Delete") {
      // console.log("Prevented deletion of outer element, but clearing content");
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

  public checkChildren() {
    this.getOrCreateInnerNode();
  }

  public setupObserver() {
    // Set up inner node and inner text subscriptions
    this.innerNode.subscribe((innerNode) => {
      if (!innerNode) return;
      this.stopObserving();
      if (!this.innerText) {
        this.innerText = writable(innerNode.innerText);
        this.innerText.subscribe((value) => {
          this.stopObserving();
          if (value !== this.node.innerText) {
            this.node.innerText = value;
          }
          this.startObserving();
        });
      } else this.innerText.set(innerNode.innerText);
    });

    // Create or get inner node
    this.getOrCreateInnerNode();

    super.setupObserver();
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
