import deriveWindow from "$lib/util/deriveWindow";
import writableDerived from "svelte-writable-derived";
import { get, writable, Writable } from "svelte/store";
import { nanoid } from "nanoid";

type observerMap = Map<Element, Partial<MutationObserverInit>>;

// Base class for all elements in the TinyMCE DOM tree that we might manipulate.
export default abstract class MceElement {
  public observer?: MutationObserver;
  public window: Window & typeof globalThis;

  public _style: Writable<CSSStyleDeclaration>;
  public classList: Writable<DOMTokenList>;
  private _classes = writable("");
  private _id: Writable<typeof this.id>;
  abstract readonly attributes: Map<string, Writable<string> | false>;
  private _attributes: Map<
    string,
    Writable<string> | typeof this._style | typeof this.classList
  >;
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

  constructor(
    public node: HTMLElement,
    public watchNodes: observerMap = new Map([[node, {}]]),
    public readonly id = nanoid()
  ) {
    // Watch ID for changes
    this._id = writable(this.id);
    this._id.subscribe((value) => {
      // TODO: Update the ID by reinstantiating the instance (is this needed?)
      // Only check self if initialized (otherwise it will be checked in the constructor)
      if (this.observer) this.checkSelf();
    });
    this._style = writable<CSSStyleDeclaration>(node.style);
    this.classList = writable<DOMTokenList>(node.classList);

    this._attributes = new Map<
      string,
      Writable<string> | typeof this._style | typeof this.classList
    >([
      ["class", this.classList],
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
    // document.getElementById("main")?.appendChild(new Text("test"));
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
        } else if (mutation.attributeName === "class") {
          const classList = <Writable<DOMTokenList | undefined>>attr;
          // Set default classList
          this.stopObserving();
          if (this.node.classList !== get(classList))
            classList.update((classes) => {
              this.defaultClasses.forEach((c) => this.node.classList.add(c));
              return this.node.classList;
            });
          this.startObserving();
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

  public startObserving() {
    this.watchNodes.forEach((options, node) => {
      if (!this.observer) {
        console.debug("Start observing called before observer was created!");
        return;
      }
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
      console.log("Observing:", node, this.observer);
    });
  }

  public stopObserving() {
    if (!this.observer) {
      // console.error("Stop observing called before observer was created!");
      return;
    }
    this.observer.disconnect();
  }

  public setupObserver(
    node = this.node,
    options?: Partial<MutationObserverInit>
  ) {
    // Update attributes and styles on node by triggering sub update
    this._style.update((_) => _);
    this.classList.update((classes) => {
      this.defaultClasses.forEach((c) => classes.add(c));
      return classes;
    });
    const ownWindow = deriveWindow(node);
    if (this.mergedAttributes.size === 0 || !ownWindow) return;

    console.log(`Created mutationObserver for ${node.nodeName}`, node);
    // Create a MutationObserver to watch for changes to the node's attributes
    this.observer = new ownWindow.MutationObserver(
      this.observerFunc.bind(this)
    );
    // Watch for changes to the node's attributes
    this.startObserving();

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

  public delete() {
    this.stopObserving();
    this.node.remove();
  }
  abstract checkChildren(): void;
  abstract checkSelf(): void;
}
