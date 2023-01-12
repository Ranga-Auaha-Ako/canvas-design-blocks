import deriveWindow from "$lib/util/deriveWindow";
import writableDerived from "svelte-writable-derived";
import { get, Readable, writable, Writable } from "svelte/store";
import { nanoid } from "nanoid";
import { McePopover } from "./popover/popover";
import { SvelteComponent } from "svelte";
import { SelectableElement } from "./selectableElement";
import { htmlVoidElements } from "html-void-elements";
import type { Editor } from "tinymce";
import type { Placement } from "@floating-ui/dom";
import type { stateObject } from "src/main";
import type { ElementManager } from "$lib/elements/generic/elementManager";

const voidElementsSet = new Set(htmlVoidElements);
voidElementsSet.add("iframe");

type observerMap = Map<Element, Partial<MutationObserverInit>>;

/**
 * The statics that subclasses of MceElement must implement.
 * - import: Used to import an existing element from the TinyMCE DOM
 * - create: Used to create a new element in the TinyMCE DOM
 */
export interface MceElementStatics {
  import: (
    state: stateObject,
    node: HTMLElement,
    manager: any, // Has to by "any" to allow manager subclasses to have their own methods
    editor: Editor
  ) => MceElement;
  create: (
    state: stateObject,
    manager: any, // Has to by "any" to allow manager subclasses to have their own methods
    atCursor: boolean,
    editor: Editor,
    highlight: boolean
  ) => MceElement;
}

/**
 * Base class for all elements in the TinyMCE DOM tree that we might manipulate.
 * - Abstracts binding to attributes, handling messy TinyMCE DOM changes, and
 *  provides a consistent interface for all elements.
 */
export default abstract class MceElement extends SelectableElement {
  /**
   * The mutationObserver which is activated/deactivated as needed
   */
  public observer?: MutationObserver;
  /**
   * References the window this element exists within
   */
  public window: Window & typeof globalThis;
  /**
   * Popover - will be set if this node has a popover
   */
  public popover?: McePopover;
  /**
   * References this.node's style, used to allow reactive style changes.
   */
  public style: Writable<CSSStyleDeclaration>;
  /**
   * References this.node's classList, used to allow reactive class changes.
   */
  public classList: Writable<DOMTokenList>;

  /**
   * Stores the attributes that should be watched for changes.
   */
  abstract readonly attributes: Map<string, Writable<string> | false>;
  /**
   * Stores the default classes that should be added to the node.
   */
  abstract defaultClasses: Set<string>;
  /**
   * Determines approach to detecting element selection
   * - TinyMCE: Uses TinyMCE's selection API to detect selection
   * - focus: Uses the focus event to detect selection
   */
  abstract selectionMethod: "TinyMCE" | "focus";

  /**
   * ID will reflect what this.node has
   */
  private _id: Writable<typeof this.id>;
  /**
   * Internal map of attributes to watch - includes style and class which are handled separately
   */
  private _attributes: Map<
    string,
    Writable<string | null> | typeof this.style | typeof this.classList
  >;
  /**
   * Unsubscriber for the TinyMCE-based selection method
   */
  private selectUnsubscriber?: () => void;

  /**
   * Merged attributes - includes the default attributes and the subclass-implemented ones
   */
  get mergedAttributes() {
    const _attrs = this._attributes;
    this.attributes.forEach((value, key) => {
      // Overwrite the default properties with the passed ones.
      if (!value) _attrs.delete(key);
      else _attrs.set(key, value);
    });
    return _attrs;
  }

  /**
   * Utility function for type narrowing
   * @param key The key of attribute to check
   * @param val The value (not used but required for type)
   * @returns True if the key is "style", declares val as CSSStyleDeclaration
   */
  static attrIsStyle = (
    key: string,
    val: string | CSSStyleDeclaration | DOMTokenList | null
  ): val is CSSStyleDeclaration => key === "style";

  /**
   * Utility function for type narrowing
   * @param key The key of attribute to check
   * @param val The value (not used but required for type)
   * @returns True if the key is "class", declares val as DOMTokenList
   */
  static attrIsClassList = (
    key: string,
    val: string | CSSStyleDeclaration | DOMTokenList | null
  ): val is DOMTokenList => key === "class";

  /**
   * Creates an MceElement instance. This does not create the element in
   * the TinyMCE DOM, and should usually be called through the static
   * create() or import() methods.
   * @param node The node in TinyMCE's DOM which this instance represents
   * @param editor The TinyMCE editor instance
   * @param watchNodes Any additional nodes to watch for changes
   * @param children Children MceElements
   * @param id The ID (captured from import or manually created)
   */
  constructor(
    public node: HTMLElement,
    public editor: Editor = window.tinymce.activeEditor,
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
      Writable<string | null> | typeof this.style | typeof this.classList
    >([
      ["class", this.classList],
      ["style", this.style],
      ["data-cgb-id", this._id],
      ["data-mce-selected", writable(null)],
      ["data-cgb-content", writable("element")],
    ]);

    // Set ID of element
    this.node.dataset.cgeId = this.id;

    // Determine the window this node is in (for iframe support)
    this.window = deriveWindow(node) || window;
  }

  /**
   * Determines whether the node is empty (contains no text or meaningful elements)
   * @param node The node to check
   * @returns True if the node is empty
   */
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

  /**
   * Observer function used by startObserving() to handle changes to the node
   * @param mutations Any mutations that have occurred (from the observer)
   */
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
      // Check if any of the nodes matter (filter out bogus elements)
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
            (<Writable<string | null>>attr).set(newValue);
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

  /**
   * Starts observing the node for changes.
   *
   * **Important: Run this after all changes have been made**
   */
  public startObserving() {
    if (this.selectionMethod === "TinyMCE") {
      // Some MCE Elements won't trigger focus events, so we need to watch for the data-mce-selected attribute
      this.selectUnsubscriber = this._attributes
        .get("data-mce-selected")
        ?.subscribe((value) => {
          if (value === "inline-boundary") {
            this.select();
          } else {
            this.deselect();
          }
        });
    } else {
      super.startObserving();
    }

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

  /**
   * Stops observing the node for changes
   *
   * **Important: Run this before making changes - otherwise the
   * element will start repairing itself mid-change!**
   */
  public stopObserving() {
    super.stopObserving();
    if (this.selectUnsubscriber) {
      this.selectUnsubscriber();
      this.selectUnsubscriber = undefined;
    }
    if (!this.observer) {
      // console.error("Stop observing called before observer was created!");
      return;
    }
    this.observer.disconnect();
    // this.watchNodes.forEach((_, node) => {
    // });
  }

  /**
   * Run once to setup the observer after instance creation
   */
  public setupObserver() {
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
        } else if (value !== undefined && value !== null) {
          node.setAttribute(key, value as string);
        }
      });
    });
  }

  /**
   * Run once to setup a popover for the node
   * @param contents The svelte component to display in the popover
   * @param props Any props to pass to the component
   * @param placement Where to place the popover
   * @returns The popover component
   */
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

  /**
   * Deletes the node from the DOM and stops observing it
   */
  public delete() {
    this.stopObserving();
    this.node.remove();
  }

  /**
   * Selects the node in the editor
   * @param scroll Whether to scroll to the node
   */
  public highlight(scroll: boolean = true) {
    if (scroll) {
      this.editor.getWin().scrollTo({
        top: this.node.offsetTop,
        behavior: "smooth",
      });
    }
    this.editor.focus();
    this.editor.selection.select(this.node);
  }
  /**
   * Function called when a change in the children is detected
   */
  abstract checkChildren(): void;
  /**
   * Function called when a change in the node is detected
   */
  abstract checkSelf(): void;
}
