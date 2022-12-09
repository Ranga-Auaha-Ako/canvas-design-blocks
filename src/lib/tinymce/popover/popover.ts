import MceElement from "../mceElement";
import { writable } from "svelte/store";
import type { SvelteComponent } from "svelte";
import PopoverWrapper from "./popoverWrapper.svelte";
import { SelectableElement } from "../selectableElement";
import { nanoid } from "nanoid";

// Caveat: only one popover can be active at a time.
let activePopover: McePopover | null = null;
let hostComponents: Map<
  Window & typeof globalThis,
  [PopoverWrapper, HTMLElement]
> = new Map();

export class McePopover extends SelectableElement {
  public readonly hostComponent: PopoverWrapper;
  public readonly node: HTMLElement;
  public readonly id: string;
  get isActive() {
    return activePopover === this && this.hostComponent.show;
  }
  constructor(
    public readonly MceElement: MceElement,
    public readonly popoverWindow: Window & typeof globalThis,
    public readonly contents?: typeof SvelteComponent,
    public readonly props?: PopoverWrapper["props"]
  ) {
    super();
    this.id = nanoid();
    const foundHostComponent = hostComponents.get(popoverWindow);
    if (!foundHostComponent) {
      this.node = popoverWindow.document.body.appendChild(
        popoverWindow.document.createElement("Div")
      );
      this.hostComponent = new PopoverWrapper({
        target: this.node,
        intro: true,
      });
      hostComponents.set(popoverWindow, [this.hostComponent, this.node]);
    } else {
      this.hostComponent = foundHostComponent[0];
      this.node = foundHostComponent[1];
    }
  }

  public show() {
    if (activePopover && activePopover.id !== this.id) activePopover.hide();
    activePopover = this;
    this.hostComponent.$set({
      component: this.contents,
      target: this.MceElement.node,
      show: true,
      props: this.props,
    });
    this.startObserving();
  }
  hide() {
    if (this.isActive) {
      this.hostComponent.$set({ show: false });
      this.stopObserving();
      console.log("Hiding popover");
    }
  }
  public startObserving() {
    this.node?.addEventListener("focusin", () => {
      const clickOutside = (e: MouseEvent) => {
        if (!this.node?.contains(e.target as Node)) {
          this.deselect();
          this.popoverWindow.removeEventListener("click", clickOutside);
        }
      };
      this.popoverWindow.addEventListener("click", clickOutside);
      this.select();
    });
  }
}
