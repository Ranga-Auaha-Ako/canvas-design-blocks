import {
  derived,
  get,
  Readable,
  Unsubscriber,
  writable,
  Writable,
} from "svelte/store";

export class SelectableElement {
  public selectsParent: boolean = false;
  public selected: Writable<Set<SelectableElement | string>> = writable(
    new Set()
  );
  private selectedTimeouts: Map<SelectableElement | string, number> = new Map();
  private parentSelected = writable(false); // Managed in constructor
  public isSelected: Readable<boolean> = derived(
    [this.selected, this.parentSelected],
    ([$selected, $parentSelected]) => {
      return $selected.size > 0 || $parentSelected;
    }
  );
  public parent: Writable<SelectableElement | false> = writable(false);
  public children: Writable<SelectableElement[]> = writable([]);
  public node?: HTMLElement;

  //  - Functions for selecting and deselecting the node
  public select(context: SelectableElement | string = this): void {
    const existingTimeout = this.selectedTimeouts.get(context);
    if (existingTimeout) clearTimeout(existingTimeout);
    this.selected.update((el) => {
      return el.add(context);
    });
    const parent = get(this.parent);
    if (parent && this.selectsParent)
      parent.selected.update((el) => {
        return el.add(context);
      });
  }
  public deselect(context: SelectableElement | string = this): void {
    // console.log("Deselecting", this.toString(), "Context:", context.toString());
    const existingTimeout = this.selectedTimeouts.get(context);
    if (existingTimeout) clearTimeout(existingTimeout);
    this.selectedTimeouts.set(
      context,
      window.setTimeout(() => {
        // Timeout to allow another element to be selected
        this.selected.update((el) => {
          el.delete(context);
          return el;
        });
        const parent = get(this.parent);
        if (parent && this.selectsParent) {
          parent.selected.update((el) => {
            el.delete(context);
            return el;
          });
        }
      }, 50)
    );
  }

  public deselectAll(): void {
    this.selected.set(new Set());
    const parent = get(this.parent);
    if (parent && this.selectsParent) {
      parent.selected.update((el) => {
        el.delete(this);
        return el;
      });
    }
  }

  constructor(node?: HTMLElement, children: SelectableElement[] = []) {
    this.node = node;

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

    // Set up parent selection - if the parent itself is selected, bubble that down to children
    let parentSelectUnsub: Unsubscriber | undefined;
    this.parent.subscribe((parent) => {
      if (parentSelectUnsub) parentSelectUnsub();
      if (parent) {
        parentSelectUnsub = parent.selected.subscribe((pSel) => {
          if (pSel.has(parent)) this.parentSelected.set(true);
          else this.parentSelected.set(false);
        });
      }
    });

    let lastSelected = new Set();
    const eqSet = (xs: Set<any>, ys: Set<any>) =>
      xs.size === ys.size && [...xs].every((x) => ys.has(x));

    this.selected.subscribe((sel) => {
      if (eqSet(sel, lastSelected)) return;
      // console.log("Selected", this.toString(), sel);
      lastSelected = sel;
    });
    // this.isSelected.subscribe((sel) => {
    //   console.log(this, "Is Selected", sel, get(this.selected));
    // });
  }

  public startObserving() {
    this.node?.addEventListener("focusin", this.select.bind(this, this));
    this.node?.addEventListener("focusout", this.deselect.bind(this, this));
  }

  public stopObserving() {
    this.node?.removeEventListener("focusin", this.select.bind(this, this));
    this.node?.removeEventListener("focusout", this.deselect.bind(this, this));
  }
}
