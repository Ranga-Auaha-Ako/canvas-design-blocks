import deriveWindow from "$lib/util/deriveWindow";
import writableDerived from "svelte-writable-derived";
import { get, writable, Writable } from "svelte/store";
import { nanoid } from "nanoid";

// Base class for all elements in the TinyMCE DOM tree that we might manipulate.
export default abstract class MceElement {
  public observer?: MutationObserver;
  public shouldObserve = true;
  public window: Window & typeof globalThis;

  public _style;
  private _classes = writable("");
  private _id: Writable<typeof this.id>;
  abstract attributes: Map<string, Writable<string> | false>;
  private _attributes: Map<string, Writable<string> | typeof this._style>;
  get mergedAttributes() {
    const _attrs = this._attributes;
    this.attributes.forEach((value, key) => {
      // Overwrite the default properties with the passed ones.
      if (!value) _attrs.delete(key);
      else _attrs.set(key, value);
    });
    return _attrs;
  }
  abstract defaultClasses: Set<string>;

  public classList = writableDerived<typeof this._classes, Set<string>>( // TODO: NEED TO SET DERIVED PROPS AFTER CONSTRUCTING!
    this._classes,
    (props) => {
      const classes = props.split(" ");
      return new Set(
        classes.filter((c) => c !== "" && !this.defaultClasses.has(c))
      ); // Remove empty classes and default classes
    },
    (reflect) => [...this.defaultClasses, ...reflect].join(" ")
  );

  constructor(public node: HTMLElement, public readonly id = nanoid()) {
    // Watch ID for changes
    this._id = writable(this.id);
    this._id.subscribe((value) => {
      // TODO: Update the ID by reinstantiating the instance (is this needed?)
      this.checkSelf();
    });
    this._style = writable<CSSStyleDeclaration>(node.style);

    this._attributes = new Map<string, Writable<string> | typeof this._style>([
      ["class", this._classes],
      ["style", this._style],
      ["data-cgb-id", this._id],
    ]);

    this.window = deriveWindow(node) || window;
  }

  public static isEmpty(node: HTMLElement): boolean {
    return (
      node.childNodes.length === 0 ||
      Array.from(node.childNodes).every((child) => {
        switch (child.nodeType) {
          case Node.ELEMENT_NODE:
            return (
              (child as HTMLElement).classList.contains(
                "cgb-empty-placeholder"
              ) ||
              (child as HTMLElement).dataset.mceBogus ||
              this.isEmpty(child as HTMLElement)
            );
          case Node.TEXT_NODE:
            return (child as Text).data.trim() === "";
          default:
            return true;
        }
      })
    );
  }

  public observerFunc(mutations: MutationRecord[]) {
    // Don't update if we shouldn't be observing. E.g. when we're updating the node ourselves.
    if (!this.shouldObserve) return;
    // Get list of changed attributes
    const changedAttributes = mutations.filter(
      (mutation) =>
        mutation.type === "attributes" && mutation.attributeName !== null
    );
    // Get changed nodes (if any)
    const changedNodes = mutations.filter((m) => {
      // Only look at childList mutations
      if (m.type !== "childList") return false;
      // Check if any of the nodes matter (either it is a valid HTMLElement or something weird happened)
      const nodes = [...m.addedNodes, ...m.removedNodes].find(
        (n) =>
          (n instanceof this.window.HTMLElement && !n.dataset.mceBogus) ||
          !(n instanceof this.window.HTMLElement)
      );
      return nodes;
    });
    // Update the attributes
    changedAttributes.forEach((mutation) => {
      // Don't update if the target node is not this.node (the main node). Can happen if this.startobserving is called on a secondary node, or if the node is a child of this.node.

      if (mutation.target !== this.node) return;
      // Only update if the attribute is in the list of attributes to watch
      const attr = this.mergedAttributes.get(mutation.attributeName!);
      if (attr) {
        if (mutation.attributeName === "style") {
          const styles = <Writable<CSSStyleDeclaration | undefined>>attr;
          const target = mutation.target as HTMLElement;
          if (target.style !== get(styles)) styles.set(target.style);
        } else {
          const newValue = this.node.getAttribute(mutation.attributeName!);
          if (newValue !== mutation.oldValue) {
            (<Writable<string>>attr).set(newValue || "");
          }
        }
      }
    });
    // If the current node has changed, check self
    if (changedAttributes.length > 0 || changedNodes.length > 0) {
      this.checkSelf();
    }
    // If child nodes have changed, check the children
    if (changedNodes.length > 0) {
      this.checkChildren();
    }
  }

  public startObserving(
    node = this.node,
    options?: Partial<MutationObserverInit>
  ) {
    // Update attributes and styles on node by triggering sub update
    this._style.update((_) => _);
    this.classList.update((_) => _);

    console.log(
      `Watching ${node.nodeName} for changes to attributes: ${[
        ...this.mergedAttributes.keys(),
      ]}`,
      node
    );
    const ownWindow = deriveWindow(node);
    if (this.mergedAttributes.size === 0 || !ownWindow) return;
    // Create a MutationObserver to watch for changes to the node's attributes
    this.observer = new ownWindow.MutationObserver(this.observerFunc);
    // Watch for changes to the node's attributes
    this.observer.observe(node, {
      ...(node === this.node
        ? {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: [...this.mergedAttributes.keys()],
          }
        : {}),
      childList: true,
      ...options,
    });

    if (node === this.node) {
      // Watch for changes to the watched props
      this.mergedAttributes.forEach((attr, key) => {
        attr.subscribe((value) => {
          console.log("Updating Attr from Store:", key, value);
          const parentWindow = deriveWindow(node);
          if (
            parentWindow &&
            value instanceof parentWindow.CSSStyleDeclaration
          ) {
            node.style.cssText = value.cssText;
          } else if (value !== undefined) {
            node.setAttribute(key, value as string);
          }
        });
      });
    }
  }

  public stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  public delete() {
    this.stopObserving();
    this.node.remove();
  }
  abstract checkChildren(): void;
  abstract checkSelf(): void;
}
