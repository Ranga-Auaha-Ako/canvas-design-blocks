import deriveWindow from "$lib/util/deriveWindow";
import { get, writable, Writable } from "svelte/store";
import { nanoid } from "nanoid";
import { McePopover } from "./popover/popover";
import { SvelteComponent } from "svelte";
import { SelectableElement } from "./selectableElement";
import { htmlVoidElements } from "html-void-elements";
import type { Editor } from "tinymce";
import type { Placement } from "@floating-ui/dom";
import type { stateObject } from "src/main";

const voidElementsSet = new Set(htmlVoidElements);
voidElementsSet.add("iframe");

export type observerMap = Map<
  HTMLElement,
  Partial<MutationObserverInit> & { name: string }
>;

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
   * The key can be in the format:
   * - "attrName" - watch the attribute on the root node. "node" nodename (root node) is implied
   * - "nodeName/attrName" - watch the attribute on a child node, where nodeName is the name of the child node (defined in WatchNodes)
   */
  abstract readonly attributes: Map<
    string,
    Writable<string | CSSStyleDeclaration | DOMTokenList> | false
  >;
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
    Writable<string | CSSStyleDeclaration | DOMTokenList | null>
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
   * Get node from WatchNodes by the NodeID (different from the ID attr)
   * @param id The ID to search for
   * @returns The node with the ID, or null if not found
   */
  getNodeById(id: string): HTMLElement | null {
    for (const [node, { name }] of this.watchNodes) {
      if (name === id) return node;
    }
    return null;
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
  ): val is CSSStyleDeclaration => key.split("/").pop() === "style";

  /**
   * Utility function for type narrowing
   * @param key The key of attribute to check
   * @param val The value (not used but required for type)
   * @returns True if the key is "class", declares val as DOMTokenList
   */
  static attrIsClassList = (
    key: string,
    val: string | CSSStyleDeclaration | DOMTokenList | null
  ): val is DOMTokenList => key.split("/").pop() === "class";

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
    public watchNodes: observerMap = new Map([[node, { name: "" }]]),
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
      ["data-cdb-id", this._id],
      ["data-mce-selected", writable(null)],
      ["data-cdb-content", writable("element")],
    ]);

    // Set ID of element
    this.node.dataset.cdbId = this.id;

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
    console.log(
      `\n${mutations
        .map((m) => `${(m.target as HTMLElement).className}:${m.type}`)
        .join(", ")} mutation(s) detected`
    );
    // Get list of changed attributes
    const changedAttributes = mutations.filter(
      (mutation) =>
        mutation.type === "attributes" && mutation.attributeName !== null
    );
    // Get changed nodes (if any)
    const changedNodes = mutations.filter((m) => {
      if (m.type !== "characterData" && m.target !== this.node) return true;
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
      // Check if the target node is not this.node (the main node). Can happen if this.startobserving is called on a secondary node, or if the node is a child of this.node.
      if (!mutation.attributeName) return;
      let targetAttr = mutation.attributeName;
      if (mutation.target !== this.node) {
        // Find the node in the watchNodes map, marking the index so we can individually identify the attribute in the mergedAttributes map
        const watchID = this.watchNodes.get(
          mutation.target as HTMLElement
        )?.name;
        if (!watchID) return;
        targetAttr = `${watchID}/${mutation.attributeName}`;
      }
      // Only update if the attribute is in the list of attributes to watch
      const attr = this.mergedAttributes.get(targetAttr);
      if (attr) {
        if (mutation.attributeName === "style") {
          const styles = <Writable<CSSStyleDeclaration | undefined>>attr;
          const target = mutation.target as HTMLElement;
          // if (target.style !== get(styles)) styles.set(target.style);
          styles.set(target.style);
          this.stopObserving();
          target.dataset.mceStyle = target.getAttribute("style") || "";
          this.startObserving();
        } else if (mutation.attributeName === "class") {
          const classList = <Writable<DOMTokenList | undefined>>attr;
          // Set default classList
          this.stopObserving();
          // if (this.node.classList !== get(classList))
          classList.update((classes) => {
            this.defaultClasses.forEach((c) => this.node.classList.add(c));
            return this.node.classList;
          });
          this.startObserving();
        } else {
          const newValue = (mutation.target as HTMLElement).getAttribute(
            mutation.attributeName!
          );
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
   * Starts observing the node for changes, but only if other
   * StopObserving() calls have not been made
   *
   * **Important: Run this after all changes have been made**
   */
  public startObserving() {
    this.stopObservingRequests -= 1;
    if (this.stopObservingRequests > 0) return;
    // if (this.observer)
    //   console.log(
    //     "Started observing:",
    //     this.watchNodes,
    //     this.watchNodes.entries().next().value[0] === this.node
    //   );
    if (this.selectionMethod === "TinyMCE") {
      // Some MCE Elements won't trigger focus events, so we need to watch for the data-mce-selected attribute
      this.selectUnsubscriber = this._attributes
        .get("data-mce-selected")
        ?.subscribe((value) => {
          if (value === "inline-boundary" || value === "1") {
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
      const observerOpts = {
        ...(node === this.node
          ? {
              attributes: true,
              attributeOldValue: true,
              attributeFilter: [...this.mergedAttributes.keys()].filter(
                // Fitler out attributes that are not on the node ("a/b")
                (attr) => attr.split("/").length === 1
              ),
            }
          : {}),
        childList: true,
        ...options,
      };
      this.observer.observe(node, observerOpts);
      // console.log("Observing:", node, observerOpts);
    });
  }

  /**
   * Stops observing the node for changes
   *
   * **Important: Run this before making changes - otherwise the
   * element will start repairing itself mid-change!**
   */
  private stopObservingRequests = 0;
  public stopObserving() {
    this.stopObservingRequests++;
    super.stopObserving();
    if (this.selectUnsubscriber) {
      this.selectUnsubscriber();
      this.selectUnsubscriber = undefined;
    }
    if (!this.observer) return;
    this.observer.disconnect();
  }

  /**
   * Run once to setup the observer after instance creation
   */
  public setupObserver() {
    const node = this.node;
    // Set attributes to match node state
    this.attributes.forEach((attr, key) => {
      let keySplit = key.split("/");
      const attrName = keySplit.pop()!;
      const watchID = keySplit.pop();
      const foundNode = watchID ? this.getNodeById(watchID) : node;
      if (!watchID && attr) {
        if (foundNode && attr) {
          const value = foundNode.getAttribute(attrName);
          if (!value) attr.set("");
          else if (value !== get(attr)) attr.set(value);
        }
      }
    });
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
        const keySplit = key.split("/");
        const attrName = keySplit.pop()!;
        const targetNodeID = keySplit.pop();
        // if (key.split("/").length > 1)
        //   console.log(
        //     "Updated:",
        //     key,
        //     this.node,
        //     targetNodeID,
        //     targetNodeID === undefined
        //       ? undefined
        //       : this.getNodeById(targetNodeID)
        //   );
        const targetNode =
          targetNodeID !== undefined ? this.getNodeById(targetNodeID) : node;
        if (!targetNode) return;
        if (MceElement.attrIsStyle(key, value)) {
          const cssText = targetNode.getAttribute("style") || "";
          this.stopObserving();
          if (targetNode.dataset.mceStyle !== cssText)
            targetNode.dataset.mceStyle = cssText;
          this.startObserving();
        } else if (MceElement.attrIsClassList(key, value)) {
          if (targetNode.classList.value === value.value) return;
          targetNode.classList.value = value.value;
        } else if (value !== undefined && value !== null) {
          targetNode.setAttribute(attrName, value);
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
    contents?: typeof SvelteComponent<any>,
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
