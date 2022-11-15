import deriveWindow from "$lib/util/deriveWindow";
import writableDerived from "svelte-writable-derived";
import { parse, stringify } from "css";
import type css from "css";
import type * as CSSType from "csstype";
import type { Rule } from "css";
import { writable, Writable } from "svelte/store";
import { nanoid } from "nanoid";

const isComment = (rule: Rule): rule is css.Comment => rule.type === "comment";

type styleObject = CSSType.PropertiesHyphen;

// Base class for all elements in the TinyMCE DOM tree that we might manipulate.
export default abstract class MceElement {
  public observer?: MutationObserver;
  public shouldObserve = true;

  private _style = writable("");
  private _classes = writable("");
  private _id: Writable<typeof this.id>;
  abstract attributes: Map<string, Writable<string> | false>;
  private _attributes: Map<string, Writable<string>>;
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

  public style = writableDerived<typeof this._style, styleObject>(
    this._style,
    (props) => {
      const styleString = `*{${props || ""}}`;
      const styles = (parse(styleString)?.stylesheet?.rules[0] as Rule)
        .declarations;
      if (!styles) return {};
      return styles.reduce((acc: styleObject, cur) => {
        if (isComment(cur) || !cur.property || !cur.value) return acc;
        // @ts-ignore - This will be a valid property
        acc[cur.property] = cur.value;
        return acc;
      }, {});
    },
    (reflect) => {
      const cssString = stringify({
        type: "stylesheet",
        stylesheet: {
          rules: [
            {
              type: "rule",
              selectors: ["*"],
              declarations: [
                ...Object.entries(reflect).map(([key, value]) => ({
                  type: "declaration",
                  property: key,
                  value,
                })),
              ],
            },
          ],
        },
      });
      return cssString.match(/\{(.*)\}/s)?.[1] || "";
    }
  );
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

    this._attributes = new Map([
      ["class", this._classes],
      ["style", this._style],
      ["data-cgb-id", this._id],
    ]);
  }

  public startObserving() {
    // Update attributes and styles on node by triggering sub update
    this.style.update((_) => _);
    this.classList.update((_) => _);

    console.log(
      `Watching ${this.node.nodeName} for changes to attributes: ${[
        ...this.mergedAttributes.keys(),
      ]}`,
      this.node
    );
    const ownWindow = deriveWindow(this.node);
    if (this.mergedAttributes.size === 0 || !ownWindow) return;
    // Create a MutationObserver to watch for changes to the node's attributes
    this.observer = new ownWindow.MutationObserver((mutations) => {
      if (!this.shouldObserve) return; // Don't update if we shouldn't be observing. E.g. when we're updating the node ourselves.
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName) {
          const attr = this.mergedAttributes.get(mutation.attributeName);
          if (attr) {
            const newValue = this.node.getAttribute(mutation.attributeName);
            if (newValue !== mutation.oldValue) {
              attr.set(newValue || "");
            }
          }
        } else if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && !node.dataset.mceBogus) {
              console.log("Child list added:", node);
              this.checkSelf();
            }
          });
          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement && !node.dataset.mceBogus) {
              console.log("Child list removed:", node);
              this.checkSelf();
            }
          });
        }
      });
    });
    // Watch for changes to the node's attributes
    this.observer.observe(this.node, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: [...this.mergedAttributes.keys()],
      childList: true,
    });

    // Watch for changes to the watched props
    this.mergedAttributes.forEach((attr, key) => {
      attr.subscribe((value) => {
        // console.log("Updating Attr from Store:", key, value);
        this.node.setAttribute(key, value);
      });
    });
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
