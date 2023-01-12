import MceElement from "../mceElement";
import { writable } from "svelte/store";
import type { SvelteComponent } from "svelte";
import PopoverWrapper from "./popoverWrapper.svelte";
import { SelectableElement } from "../selectableElement";
import { nanoid } from "nanoid";
import type { Placement } from "@floating-ui/dom";

export class McePopover extends SelectableElement {
  public readonly hostComponent: PopoverWrapper;
  public readonly node: HTMLElement;
  public readonly id: string;
  public get isActive() {
    return this.hostComponent.component && this.hostComponent.show;
  }
  private _isActive = false;

  constructor(
    public readonly MceElement: MceElement,
    public readonly popoverWindow: Window & typeof globalThis,
    public readonly contents?: typeof SvelteComponent,
    public readonly props?: PopoverWrapper["props"],
    public readonly placement?: Placement
  ) {
    super();
    this.id = nanoid();
    this.node = popoverWindow.document.body.appendChild(
      popoverWindow.document.createElement("Div")
    );
    this.hostComponent = new PopoverWrapper({
      target: this.node,
      intro: true,
    });
  }

  public show() {
    if (this.isActive) return;
    this._isActive = true;
    this.hostComponent.$set({
      component: this.contents,
      target: this.MceElement.node,
      show: true,
      props: this.props,
      placement: this.placement,
    });
    this.startObserving();
  }
  hide() {
    if (!this.isActive) return;
    this._isActive = false;
    this.hostComponent.$set({ show: false });
    this.stopObserving();
  }
  private clickOutside = (e: MouseEvent) => {
    if (!this.node?.contains(e.target as Node)) {
      this.MceElement.deselect("Popover");
      this.popoverWindow.removeEventListener("click", this.clickOutside);
    }
  };
  public startObserving() {
    this.node?.addEventListener("focusin", () => {
      this.popoverWindow.addEventListener("click", this.clickOutside);
      this.MceElement.select("Popover");
    });
  }
}
