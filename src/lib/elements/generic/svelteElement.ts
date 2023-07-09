import { Writable, writable } from "svelte/store";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import type ElementManager from "./elementManager";
import type { ComponentType, SvelteComponent } from "svelte";

/**
 * SafeState is a container for any data that can be safely rendered as HTML
 * without the risk of XSS attacks.
 */
export interface SafeState {
  safeState: Record<any, any>;
}

/**
 * SvelteElement is a generic element that can be used to render any Svelte
 * component in TinyMCE.
 * @extends MceElement
 * @template StateData The type of the data that the Svelte component will receive.
 */
export abstract class SvelteElement<
  StateData extends SafeState
> extends MceElement {
  selectionMethod: "TinyMCE" | "focus" = "TinyMCE";
  public staticAttributes = {
    "data-cdb-version": SvelteElement.markupVersion,
    contenteditable: "false",
  };
  public static markupVersion = "1.0.0";
  public SvelteState: Writable<StateData | undefined> = writable();
  private dataEl: HTMLElement | undefined;

  constructor(
    public editor: Editor = window.tinymce.activeEditor,
    public manager: ElementManager,
    public node: HTMLElement,
    public svelteComponent: ComponentType<
      SvelteComponent<{ cdbData: StateData }>
    >,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(node, editor, undefined, undefined, id, true);

    Object.entries(this.staticAttributes).forEach(([key, value]) => {
      if (node.getAttribute(key) !== value) {
        node.setAttribute(key, value);
      }
    });

    let lastContents: SvelteComponent<{ cdbData: StateData }> | undefined;
    const updateDataEl = (state: StateData) => {
      if (!this.dataEl || this.dataEl.parentElement !== this.node) {
        this.dataEl = document.createElement("div");
        this.dataEl.classList.add("cdbData");
        this.dataEl.style.display = "none";
      }
      this.dataEl.innerText = JSON.stringify(state);
      return this.dataEl;
    };

    this.SvelteState.subscribe((elState) => {
      if (elState) {
        this.stopObserving();
        this.node.innerHTML = "";
        this.dataEl = undefined;
        this.node.appendChild(updateDataEl(elState));
        lastContents?.$destroy();
        lastContents = new svelteComponent({
          target: this.node,
          props: {
            cdbData: elState,
          },
        });
        lastContents.$on("update", ({ detail }) => {
          if (detail) {
            updateDataEl(detail);
          }
        });
        this.startObserving();
      }
    });
    if (highlight) this.highlight();
  }
  abstract get safeState(): SafeState["safeState"];
  /**
   * This method is called when the element is first created. It should be used
   * to instantiate the Svelte element and load data from the DOM.
   * @returns Whether the element was successfully loaded.
   */
  loadData() {
    let dataEl = this.node.querySelector(".cdbData");
    const stateString = dataEl?.textContent;
    try {
      if (stateString) {
        const parsedStateData = JSON.parse(stateString) as StateData;
        const { safeState: _, ...unsafeState } = parsedStateData;
        this.SvelteState.set({
          ...unsafeState,
          safeState: this.safeState,
        } as StateData);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  checkChildren(): void {}
  checkSelf(): void {
    // Self is perfect
  }
  public delete() {
    this.popover?.hide();
    super.delete();
  }
}
