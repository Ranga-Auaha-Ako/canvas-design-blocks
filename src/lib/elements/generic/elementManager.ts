import { get, writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { stateObject } from "src/desktop";
import MceElement, {
  MceElementStatics,
} from "$lib/elements/generic/mceElement";
import type { ComponentType } from "svelte";

export abstract class ElementManager implements Writable<MceElement[]> {
  public _elements: Writable<MceElement[]> = writable([]);
  /**
   * The query selector that will be used to find elements in the TinyMCE DOM.
   */
  abstract selector: string;
  abstract elementClass: Omit<typeof MceElement, "new"> & MceElementStatics;
  // Details about the element
  abstract elementName: string;
  abstract elementDescription: string;
  abstract icon?: string;
  abstract elementVideo?: string;

  public set = this._elements.set;
  public update = this._elements.update;
  public subscribe = this._elements.subscribe;
  private editorStyleEl?: HTMLStyleElement;
  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor,
    private readonly editorStyles?: string
  ) {
    this.watchEditor();
    if (editorStyles) {
      // Inject our styles into the TinyMCE editor
      this.editorStyleEl = document.createElement("style");
      this.editorStyleEl.innerHTML = editorStyles;
      editor.getBody().insertAdjacentElement("beforebegin", this.editorStyleEl);
    }
  }
  public create(atCursor = false, highlight = false) {
    if (this.detached) return;
    const element = this.elementClass.create(
      this.state,
      this,
      atCursor,
      this.editor,
      highlight
    );
    this.add(element);
    return element;
  }
  public add(element: MceElement | MceElement[]) {
    if (this.detached) return;
    if (Array.isArray(element)) {
      this.update((elements) => {
        return [...elements, ...element];
      });
    } else {
      this.update((elements) => [...elements, element]);
    }
  }
  public remove(element: MceElement | string) {
    if (this.detached) return;
    let foundElement: MceElement | undefined;
    if (typeof element === "string") foundElement = this.get(element);
    else foundElement = element;
    if (!foundElement) return;
    this.update((elements) => {
      return elements.filter((el) => el !== element);
    });
  }
  public get(id: string) {
    return get(this._elements).find((el) => el.id === id);
  }

  public findAll(returnAll = false) {
    const root = this.editor.dom.getRoot();
    // Filter to only elements we haven't already discovered
    const existingIDs = get(this._elements).map((el) => el.id);
    return Array.from(root.querySelectorAll(this.selector)).filter((e) => {
      if (returnAll) return true;
      // Discard TinyMCE Fake Elements
      if (e.closest("[data-mce-bogus]")) return false;
      // Get ID
      const id = (e as HTMLElement)?.dataset.cdbId;
      // No ID Means the element is untracked - we need to track it
      if (!id) return true;
      // If we have an ID, check if we are already tracking it
      const foundIndex = existingIDs.indexOf(id);
      if (foundIndex === -1) {
        return true;
      }
      // We are already tracking it. Any more grids with this ID are duplicates and should be imported with a new ID;
      existingIDs.splice(foundIndex, 1);
      return false;
    }) as HTMLElement[];
  }

  public importAll() {
    if (this.detached) return;
    const newElements = this.findAll().map((el) => {
      // Cleaning up old IDs
      if (el.dataset.cgbId) delete el.dataset.cgbId;
      if (el.dataset.cgeId) delete el.dataset.cgeId;
      if (el.dataset.cgbVersion) {
        el.dataset.cdbVersion = el.dataset.cgbVersion;
        delete el.dataset.cgbVersion;
      }
      if (el.dataset.cgbContent) delete el.dataset.cgbContent;
      return this.elementClass.import(this.state, el, this, this.editor);
    });
    if (newElements.length) this.add(newElements);
  }

  public checkElements() {
    if (this.detached) return;
    // Check to see if our internal representation of elements matches the DOM
    // If not, update our internal representation

    // Disconnect any deleted elements
    const elementIds = this.findAll(true).map((el) => el.dataset.cdbId);
    const internalElementIds = get(this._elements).map((el) => el.id);
    const deletedElementIds = internalElementIds.filter(
      (id) => !elementIds.includes(id)
    );
    deletedElementIds.forEach((id) => {
      // console.log("Removing element", id);
      const element = this.get(id);
      if (element) element.delete();
    });

    // Check existing elements for changes
    const nodeUpdated = get(this._elements).filter((el) => {
      if (!el.editor.getDoc().contains(el.node)) {
        // console.log(
        //   `Element (${this.elementName}) no longer in DOM, removing`,
        //   el.id
        // );
        el.delete();
        return true;
      }
      return false;
    });
    if (nodeUpdated.length)
      this._elements.update((elements) =>
        elements.filter((el) => !nodeUpdated.includes(el))
      );

    // Import any new elements
    this.importAll();

    // Fire off checks in each element
    get(this._elements).forEach((el) => el.checkChildren());
  }

  detached = false;
  public detatch() {
    // Detach the manager from the editor - this is used when the editor is destroyed
    console.log("Detatching", this.elementName);

    const potentialChangeEvents = ["Undo", "Redo", "BeforeAddUndo"];
    potentialChangeEvents.forEach((evtName) => {
      this.editor.off(evtName, this._watchFunc);
    });

    this.detached = true;

    this._elements.update((elements) => {
      elements.forEach((el) => {
        el.detach();
      });
      return [];
    });
    this.editorStyleEl?.remove();
  }

  private _watchFunc() {
    this.checkElements();
  }

  private watchEditor() {
    // console.log("Watching editor", this.editor.getBody());
    // Keep an eye on TinyMCE in case operations within the tool cause the "real" grids to be removed, added, moved, or otherwise modified.

    this._watchFunc = this._watchFunc.bind(this);

    // Events where we know to check for changes
    const potentialChangeEvents = ["Undo", "Redo", "BeforeAddUndo"];
    potentialChangeEvents.forEach((evtName) => {
      this.editor.on(evtName, this._watchFunc);
    });

    // // Events where we need to hide the interface
    // const hideInterfaceEvents = ["dragstart"];
    // hideInterfaceEvents.forEach((evtName) => {
    //   this.editor.on(evtName, (e) => {
    //     this.state.showInterface.set(false);
    //     get(this._elements).forEach((el) => el.selected.set(new Set()));
    //   });
    // });
  }
}

export default ElementManager;
