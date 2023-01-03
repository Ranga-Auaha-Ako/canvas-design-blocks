import deriveWindow from "$lib/util/deriveWindow";
import writableDerived from "svelte-writable-derived";
import { get, Readable, writable, Writable } from "svelte/store";
import { nanoid } from "nanoid";
import { Editor } from "tinymce";
import { McePopover } from "./popover/popover";
import { SvelteComponent } from "svelte";
import { SelectableElement } from "./selectableElement";
import { htmlVoidElements } from "html-void-elements";
import type { Placement } from "@floating-ui/dom";

const voidElementsSet = new Set(htmlVoidElements);
voidElementsSet.add("iframe");

type observerMap = Map<Element, Partial<MutationObserverInit>>;

// Base class for all elements in the TinyMCE DOM tree that we might manipulate.
export default abstract class MceElement extends SelectableElement {
  // Public properties
  public observer?: MutationObserver;
  public window: Window & typeof globalThis;
  // - Popover - will be set if this node has a popover
  public popover?: McePopover;
  //  - Style and classlist - will reflect what this.node has
  public style: Writable<CSSStyleDeclaration>;
  public classList: Writable<DOMTokenList>;

  // Requires implementation.
  //  - Stores the attributes that should be watched for changes.
  abstract readonly attributes: Map<string, Writable<string> | false>;
  //  - Stores the default classes that should be added to the node.
  abstract defaultClasses: Set<string>;

  // Private properties
  //  - ID will reflect what this.node has
  private _id: Writable<typeof this.id>;
  //  - Internal map of attributes to watch - includes style and class which are handled separately
  private _attributes: Map<
    string,
    Writable<string> | typeof this.style | typeof this.classList
  >;
  // Merged attributes - includes the default attributes and the subclass-implemented ones
  get mergedAttributes() {
    const _attrs = this._attributes;
    this.attributes.forEach((value, key) => {
      // Overwrite the default properties with the passed ones.
      if (!value) _attrs.delete(key);
      else _attrs.set(key, value);
    });
    return _attrs;
  }
  static attrIsStyle = (
    key: string,
    val: string | CSSStyleDeclaration | DOMTokenList
  ): val is CSSStyleDeclaration => key === "style";
  static attrIsClassList = (
    key: string,
    val: string | CSSStyleDeclaration | DOMTokenList
  ): val is DOMTokenList => key === "class";

  constructor(
    public node: HTMLElement,
    public watchNodes: observerMap = new Map([[node, {}]]),
    children: MceElement[] = [],
    public readonly id = nanoid()
  ) {
    super(node, children);
    // Watch ID for changes
    this._id = writable(this.id);
    this._id.subscribe((value) => {
      // TODO: Update the ID by reinstantiating the instance (is this needed?)
      // Only check self if initialized (otherwise it will be checked in the constructor)
      if (this.observer) this.checkSelf();
    });
    // Watch style and classlist for changes
    this.style = writable<CSSStyleDeclaration>(node.style);
    this.classList = writable<DOMTokenList>(node.classList);

    // Build internal map of attributes to watch
    this._attributes = new Map<
      string,
      Writable<string> | typeof this.style | typeof this.classList
    >([
      ["class", this.classList],
      ["style", this.style],
      ["data-cgb-id", this._id],
    ]);

    // Determine the window this node is in (for iframe support)
    this.window = deriveWindow(node) || window;
  }

  public static isEmpty(node: HTMLElement): boolean {
    return (
      !voidElementsSet.has(node.tagName.toLowerCase()) &&
      (node.childNodes.length === 0 ||
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
        }))
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
    super.startObserving();
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
      // console.log("Observing:", node, this.observer);
    });
  }

  public stopObserving() {
    super.stopObserving();
    if (!this.observer) {
      // console.error("Stop observing called before observer was created!");
      return;
    }
    this.observer.disconnect();
    // this.watchNodes.forEach((_, node) => {
    // });
  }

  public setupObserver(editor?: Editor) {
    const node = this.node;
    // Update attributes and styles on node by triggering sub update
    this.style.update((_) => _);
    this.classList.update((classes) => {
      this.defaultClasses.forEach((c) => classes.add(c));
      return classes;
    });
    const ownWindow = deriveWindow(node);
    if (this.mergedAttributes.size === 0 || !ownWindow) return;

    // console.log(`Created mutationObserver for ${node.nodeName}`, node);
    // Create a MutationObserver to watch for changes to the node's attributes
    this.observer = new ownWindow.MutationObserver(
      this.observerFunc.bind(this)
    );
    // Watch for changes to the node's attributes
    this.startObserving();

    // Watch for changes to the watched props
    this.mergedAttributes.forEach((attr, key) => {
      attr.subscribe((value) => {
        if (MceElement.attrIsStyle(key, value)) {
          const cssText = value.cssText;
          node.style.cssText = cssText;
          node.dataset.mceStyle = cssText;
        } else if (MceElement.attrIsClassList(key, value)) {
          node.classList.value = value.value;
        } else if (value !== undefined) {
          node.setAttribute(key, value as string);
        }
      });
    });

    // const startObserving = this.startObserving.bind(this);
    // const stopObserving = this.stopObserving.bind(this);
    // // Stop observing and start observing when editor looses focus
    // editor?.on("focus", startObserving);
    // editor?.on("blur", stopObserving);
    // // Stop observing and start observing when editor is activated or deactivated
    // editor?.on("activate", startObserving);
    // editor?.on("deactivate", stopObserving);
    // // Stop observing and start observing when editor is getting content
    // editor?.on("BeforeGetContent", stopObserving);
    // editor?.on("GetContent", startObserving);
    // // Stop observing and start observing when editor is setting content
    // editor?.on("BeforeSetContent", stopObserving);
    // editor?.on("SetContent", startObserving);
  }

  public setupPopover(
    contents?: typeof SvelteComponent,
    props?: McePopover["props"],
    placement?: Placement
  ) {
    if (this.popover) {
      this.popover.hostComponent.$set({ component: contents, props });
    } else {
      // Create a popover for the node
      const popover = new McePopover(this, window, contents, props, placement);
      this.popover = popover;
      this.children.update((children) => {
        children.push(popover);
        return children;
      });
    }
    // Return the popover
    return this.popover;
  }

  public delete() {
    this.stopObserving();
    this.node.remove();
  }
  abstract checkChildren(): void;
  abstract checkSelf(): void;
}
