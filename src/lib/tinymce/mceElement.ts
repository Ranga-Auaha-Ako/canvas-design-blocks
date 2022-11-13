import deriveWindow from "$lib/util/deriveWindow";
import { Writable } from "svelte/store";

// Base class for all elements in the TinyMCE DOM tree that we might manipulate.
export default class MceElement {
  public observer?: MutationObserver;

  constructor(public node: HTMLElement) {
    this.node = node;
  }

  public startObserving(props: Map<string, Writable<string>>) {
    console.log(
      `Watching ${this.node.nodeName} for changes to attributes: ${[
        ...props.keys(),
      ]}`,
      this.node.parentElement || this.node
    );
    const ownWindow = deriveWindow(this.node);
    if (props.size === 0 || !ownWindow) return;
    // Create a MutationObserver to watch for changes to the node's attributes
    this.observer = new ownWindow.MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName) {
          const prop = props.get(mutation.attributeName);
          if (prop) {
            const newValue = this.node.getAttribute(mutation.attributeName);
            if (newValue !== mutation.oldValue) {
              prop.set(newValue || "");
            }
          }
        }
      });
    });
    // Watch for changes to the node's attributes
    this.observer.observe(this.node, {
      attributes: true,
      attributeOldValue: true,
      //   attributeFilter: Array.from(props.keys()),
    });

    // Watch for changes to the watched props
    props.forEach((prop, key) => {
      prop.subscribe((value) => {
        console.log("Updating Prop from Store:", key, value);
        this.node.setAttribute(key, value);
      });
    });
  }
}
