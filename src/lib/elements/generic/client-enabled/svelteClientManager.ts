// Svelte-based element manager that also instantiates a Svelte component on the rendered page
import {
  type ElementComponent,
  SvelteElement,
  SvelteStateClass,
} from "../svelteElement";
import { get, writable } from "svelte/store";

export abstract class ClientElementManager<stateDataType> {
  private additionalState: Record<string, unknown> = {};
  private clientComponent:
    | ElementComponent<
        stateDataType,
        unknown,
        SvelteElement<stateDataType, unknown>
      >
    | undefined = undefined;
  public abstract stateClass: SvelteStateClass<stateDataType>;
  public abstract svelteClientComponent: SvelteElement<
    stateDataType,
    unknown
  >["svelteComponent"];
  public abstract selector: string;
  constructor(mode: "desktop" | "mobile") {}
  renderClientComponent() {
    // Check to see if element exists in the DOM
    document.querySelectorAll(this.selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        // Get state from DOM
        const dataEl = el.querySelector(".cdbData");
        const state = new this.stateClass(
          JSON.parse(dataEl?.textContent || "{}"),
          el
        );
        // Remove other elements
        el.innerHTML = "";
        // Instantiate Svelte component
        this.clientComponent = new this.svelteClientComponent({
          target: el,
          props: {
            cdbData: get(state),
            localState: writable(this.additionalState),
            destroyHandler: () => {
              // N/A
            },
          },
        });
      }
    });
  }
}
