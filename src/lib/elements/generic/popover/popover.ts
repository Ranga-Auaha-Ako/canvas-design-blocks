import MceElement from "../mceElement";
import { derived, get, Writable, writable } from "svelte/store";
import type { SvelteComponent } from "svelte";
import PopoverWrapper from "./popoverWrapper.svelte";
import { SelectableElement } from "../selectableElement";
import { nanoid } from "nanoid";
import type { Placement } from "@floating-ui/dom";

let activePopover: Writable<McePopover | null> = writable(null);
// activePopover.subscribe((popover) => {
//   console.log("Active popover", popover?.id);
// });

export class McePopover extends SelectableElement {
  public readonly hostComponent: PopoverWrapper;
  public readonly node: HTMLElement;
  public readonly id: string;
  public get isActive() {
    return this.hostComponent.component && this.hostComponent.show;
  }
  private _isActive = false;
  private _hideUnsub: (() => void) | undefined = undefined;
  public readonly isDominant: Writable<boolean>;

  constructor(
    public readonly MceElement: MceElement,
    public readonly popoverWindow: Window & typeof globalThis,
    public readonly contents?: typeof SvelteComponent<any>,
    public readonly props?: PopoverWrapper["props"],
    public readonly placement?: Placement,
    public middleware?: PopoverWrapper["middleware"],
    isDominant: boolean = false,
    public options?: {
      showArrow?: boolean;
    }
  ) {
    super();
    this.isDominant = writable(isDominant);
    this.isDominant.subscribe((isDominant) => {
      if (isDominant) activePopover.set(this);
    });
    this.id = nanoid();
    this.node = popoverWindow.document.body.appendChild(
      popoverWindow.document.createElement("Div")
    );
    this.hostComponent = new PopoverWrapper({
      props: {
        host: this,
      },
      target: this.node,
      intro: true,
    });
  }

  public show(focus = false) {
    // console.log(
    //   "Showing popover",
    //   this.MceElement.id,
    //   this.MceElement.node,
    //   this.props,
    //   this.placement
    // );
    if (this.isActive && !focus) return;
    this._isActive = true;

    this.hostComponent.$set({
      component: this.contents,
      target: this.MceElement.node,
      show: true,
      props: this.props,
      placement: this.placement,
      isDominant: this.isDominant,
      middleware: this.middleware,
      dominantPopover: derived(
        activePopover,
        (activePopover) => activePopover === this
      ),
      ...this.options,
    });
    this.startObserving();
    if (get(this.isDominant)) {
      activePopover.set(this);
    }
    if (focus) this.hostComponent.focus();
  }
  hide() {
    // console.log("Hiding popover", this.MceElement.id);
    if (!this.isActive) return;
    this._isActive = false;
    this.hostComponent.$set({ show: false });
    this.stopObserving();
    if (this._hideUnsub) {
      this._hideUnsub();
      this._hideUnsub = undefined;
    }
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
