import { get, writable, Writable } from "svelte/store";

export class SelectableElement {
  public selected: Writable<SelectableElement | false>;
  public parent: Writable<SelectableElement | false> = writable(false);
  public children: Writable<SelectableElement[]> = writable([]);
  public node?: HTMLElement;
  private timeoutId: number | undefined;

  //  - Functions for selecting and deselecting the node
  public select: () => void = () => {
    this.selected.set(this);
    const parent = get(this.parent);
    if (parent) parent.selected.set(this);
    if (this.timeoutId) window.clearTimeout(this.timeoutId);
    // console.log("Parent", parent, "of", this, "is now selected");
  };
  public deselect: () => void = () => {
    if (this.timeoutId) window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      // Timeout to allow another element to be selected
      this.selected.update((el) => {
        if (el !== this) return el;
        return false;
      });
      const parent = get(this.parent);
      if (parent) {
        parent.selected.update((el) => {
          if (el !== this) return el;
          return false;
        });
      }
    }, 50);
  };

  constructor(node?: HTMLElement, children: SelectableElement[] = []) {
    this.node = node;
    this.selected = writable(false);

    // Add children
    let previousChildren: SelectableElement[] = get(this.children);
    this.children.subscribe((children) => {
      children.forEach((child) => {
        child.parent.set(this);
      });
      // Remove old children
      previousChildren.forEach((child) => {
        if (!children.includes(child)) child.parent.set(false);
      });
      previousChildren = children;
    });
    this.children.set(children);
  }

  public startObserving() {
    this.node?.addEventListener("focusin", this.select);
    this.node?.addEventListener("focusout", this.deselect);
  }

  public stopObserving() {
    this.node?.removeEventListener("focusin", this.select);
    this.node?.removeEventListener("focusout", this.deselect);
  }
}
