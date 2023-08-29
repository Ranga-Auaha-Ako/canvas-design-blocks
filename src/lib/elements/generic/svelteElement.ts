import { Writable, writable } from "svelte/store";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import type ElementManager from "./elementManager";
import type { ComponentType, SvelteComponent } from "svelte";

export interface SvelteState<State> extends Writable<State> {
  state: Writable<State>;
  get stateString(): string;
}
export type SvelteStateClass<State> = new (
  unsafeState: Partial<State> | undefined,
  node?: HTMLElement
) => SvelteState<State>;

/**
 * SvelteElement is a generic element that can be used to render any Svelte
 * component in TinyMCE.
 * @extends MceElement
 * @template StateData The type of the data that the Svelte component will receive.
 */
export abstract class SvelteElement<stateDataType> extends MceElement {
  selectionMethod: MceElement["selectionMethod"] = "TinyMCE";
  public staticAttributes = {
    "data-cdb-version": SvelteElement.markupVersion,
    contenteditable: "false",
  };
  public static markupVersion = "1.0.0";
  public SvelteState: SvelteState<stateDataType>;
  private dataEl: HTMLElement | undefined;

  constructor(
    public editor: Editor = window.tinymce.activeEditor,
    public manager: ElementManager,
    public node: HTMLElement,
    public svelteComponent: ComponentType<
      SvelteComponent<{ cdbData: stateDataType }>
    >,
    public stateClass: SvelteStateClass<stateDataType>,
    public readonly id = nanoid(),
    highlight = false,
    defaultState?: Partial<stateDataType>
  ) {
    super(node, editor, undefined, undefined, id, true);

    Object.entries(this.staticAttributes).forEach(([key, value]) => {
      if (node.getAttribute(key) !== value) {
        node.setAttribute(key, value);
      }
    });

    let lastContents: SvelteComponent<{ cdbData: stateDataType }> | undefined;
    const createDataEl = () => {
      if (!this.dataEl || this.dataEl.parentElement !== this.node) {
        this.dataEl = document.createElement("div");
        this.dataEl.classList.add("cdbData");
        this.dataEl.style.display = "none";
      }
      this.dataEl.innerText = this.SvelteState.stateString;
      return this.dataEl;
    };

    let dataEl = this.node.querySelector(".cdbData");
    const stateString = dataEl?.textContent;
    let parsedStateData: Partial<stateDataType> | undefined;
    try {
      if (stateString) {
        parsedStateData = JSON.parse(stateString) as Partial<stateDataType>;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log("Failed to load data for SvelteElement:", this);
      }
    }
    if (!parsedStateData) {
      parsedStateData = defaultState || undefined;
    }
    this.SvelteState = new stateClass(parsedStateData, node);
    this.SvelteState.subscribe((elState) => {
      if (elState) {
        this.stopObserving();
        this.node.innerHTML = "";
        this.dataEl = undefined;
        this.node.appendChild(createDataEl());
        lastContents?.$destroy();
        lastContents = new svelteComponent({
          target: this.node,
          props: {
            cdbData: elState,
          },
        });
        lastContents.$on("update", ({ detail }) => {
          if (detail) {
            createDataEl();
          }
        });
        this.startObserving();
      }
    });

    if (highlight) this.highlight();
  }

  public updateDataEl() {
    if (!this.dataEl || !this.dataEl.parentElement) {
      this.SvelteState.update((state) => state);
      return;
    }
    this.dataEl.innerText = this.SvelteState.stateString;
  }
  checkChildren() {
    // Children are monitored in other ways
    this.updateDataEl();
  }
  checkSelf(): void {
    // Self is perfect
  }
  public delete() {
    this.popover?.hide();
    super.delete();
  }
}
