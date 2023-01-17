import MceElement from "$lib/elements/generic/mceElement";
import type { McePopover } from "$lib/elements/generic/popover/popover";
import { get, Unsubscriber, Writable, writable } from "svelte/store";
import type Grid from "./grid";
import ColMenu from "./popup/colMenu.svelte";
import Row from "./row";
import { ColumnLayout, gridSize } from "./rowLayouts";
import { writable as localStorageWritable } from "svelte-local-storage-store";
import type { Editor } from "tinymce";

export default class Column extends MceElement {
  public selectsParent = true;
  public selectionMethod: "TinyMCE" | "focus" = "focus";
  public trackInnerText = false;
  public width: Writable<Required<ColumnLayout>>;
  public attributes: MceElement["attributes"] = new Map([]);
  public defaultClasses = new Set(["cgb-col"]);
  public parentRow?: Row;
  public popover: McePopover;
  public showPopover: Writable<boolean>;

  public getTextTarget() {
    const foundParagraphs = this.innerNode.querySelectorAll(
      ":scope > p:not([data-mce-caret]):not([data-mce-bogus])"
    ) as NodeListOf<HTMLParagraphElement>;
    let textTarget: HTMLElement;
    if (!foundParagraphs.length)
      textTarget = this.parentGrid.editor.dom.add(this.innerNode, "p");
    else textTarget = foundParagraphs[foundParagraphs.length - 1];
    if (MceElement.isEmpty(textTarget)) {
      textTarget.innerHTML = "";
      this.parentGrid.editor.dom.add(textTarget, "br", {
        "data-mce-bogus": "1",
      });
    }
    return foundParagraphs[foundParagraphs.length - 1];
  }

  public checkSelf() {
    // this.stopObserving();
    // We don't need to check anything, but if we did, we'd do it here.
    // this.startObserving();
  }

  public checkChildren() {
    this.stopObserving();
    // Check if innernode still exists
    let isNew;
    [this.innerNode, isNew] = Column.getOrCreateInnerNode(
      this.parentGrid,
      this.node,
      this.innerNode
    );
    if (isNew) {
      this.watchNodes.clear();
      this.watchNodes.set(this.node, {});
      this.watchNodes.set(this.innerNode, {});
    }
    this.startObserving();
  }

  static create(row: Row, width: Required<ColumnLayout>, parentRow?: Row) {
    const node = row.parentGrid.editor.dom.create("div", {
      class: "cgb-col",
    });
    row.parentGrid.editor.dom.add(row.node, node);
    const innerNode = row.parentGrid.editor.dom.add(node, "div", {
      contenteditable: true,
      class: "cgb-col-inner",
    });
    return new Column(row.parentGrid, width, node, innerNode);
  }

  static getOrCreateInnerNode(
    grid: Grid,
    outerNode: HTMLElement,
    innerNode?: HTMLElement
  ): [HTMLElement, boolean] {
    let isNew = false;
    let foundInnerNode: HTMLElement;
    if (!innerNode || innerNode.parentNode !== outerNode) {
      foundInnerNode = outerNode.querySelector(
        ":scope > div.cgb-col-inner"
      ) as HTMLDivElement;
      if (!foundInnerNode) {
        foundInnerNode = grid.editor.dom.create("div", {
          contenteditable: true,
          class: "cgb-col-inner",
        });
        outerNode.appendChild(foundInnerNode);
      }
      grid.editor.dom.setAttrib(foundInnerNode, "contenteditable", "true");
      isNew = foundInnerNode !== innerNode;
    } else {
      foundInnerNode = innerNode;
      grid.editor.dom.setAttrib(foundInnerNode, "contenteditable", "true");
    }

    // Move any other children into the inner node - we don't need them
    [...outerNode.childNodes].forEach((n) => {
      if (
        n !== foundInnerNode &&
        n.nodeType !== Node.COMMENT_NODE &&
        (n as HTMLElement)?.dataset.cgbNoMove !== "true" // Allow some nodes to be left in place if the author wants
      ) {
        console.log("Moving incorrectly placed element into inner node", n);
        (foundInnerNode as HTMLElement).appendChild(n);
      }
    });

    // REMOVED: This introduced more problems than it solved - TinyMCE makes a lot of these text nodes, and moving them can create issues with text like "Hello" being split into "H" "e" "l" "l" "o"
    // // If the column uses the old format (has text as direct decendant rather than in a paragraph), move it into a paragraph
    // [...foundInnerNode.childNodes]
    //   .filter((n) => n.nodeType === Node.TEXT_NODE)
    //   .forEach((n) => {
    //     // Add to new paragraph
    //     n.textContent?.trim() &&
    //       grid.editor.dom.add(foundInnerNode, "p", {}, n.textContent);
    //     // Remove old text node
    //     grid.editor.dom.remove(n);
    //   });

    // If the column is empty, reset it to a single empty paragraph
    if (MceElement.isEmpty(foundInnerNode)) {
      foundInnerNode.innerHTML = "";
      grid.editor.dom.add(
        foundInnerNode,
        "div",
        {
          class: "cgb-empty-placeholder",
          style: "display: none",
          contenteditable: false,
        },
        "&nbsp;"
      );
      const target = grid.editor.dom.add(foundInnerNode, "p");
      grid.editor.dom.add(target, "br", {
        "data-mce-bogus": "1",
      });
      // Move cursor to the new paragraph if it's inside `node`
      if (grid.editor.selection.getNode().closest(".cgb-col") === outerNode) {
        grid.editor.selection.setCursorLocation(target, 0);
        // console.log("Moving cursor to new paragraph");
      }
    }
    return [foundInnerNode, isNew];
  }

  static import(grid: Grid, node: HTMLElement, width: Required<ColumnLayout>) {
    let [innerNode, isNew] = this.getOrCreateInnerNode(grid, node);
    return new Column(
      grid,
      width,
      node,
      innerNode,
      node.dataset.cgbId || undefined
    );
  }

  constructor(
    public parentGrid: Grid,
    width: Required<ColumnLayout>,
    public node: HTMLElement,
    public innerNode: HTMLElement,
    id?: string
  ) {
    super(node, parentGrid.editor, undefined, undefined, id);
    this.showPopover = localStorageWritable(
      "cgb-preferences-showadvanced",
      false
    );
    this.width = writable(width);
    this.width.subscribe((width) => {
      this.classList.update((classes) => {
        // Remove all width classes
        const widthClasses = Array.from(classes).filter((c) =>
          c.match(/^col-(xs|sm|md|lg)/)
        );
        classes.remove(...widthClasses);
        // Add new width classes
        [
          `col-xs-${width.xs}`,
          `col-sm-${width.sm}`,
          `col-md-${width.md}`,
          `col-lg-${width.lg}`,
        ].forEach((c) => {
          classes.add(c);
        });
        return classes;
      });
    });
    // Fix children if needed
    this.checkChildren();
    // Bind to clicks and move the focus
    this.parentGrid.editor.dom.bind(this.node, "click", (e) => {
      this.checkChildren();
      //Move selection if we need to.
      if (!this.innerNode.contains(e.target)) {
        const textTarget = this.parentGrid.editor.dom.add(
          this.getTextTarget(),
          "span"
        );
        if (textTarget) this.parentGrid.editor.selection.select(textTarget);
      }
    });
    this.parentGrid.editor.dom.bind(this.node, "keydown", (e) => {
      if (!(e.key === "Backspace" || e.key === "Delete")) return;
      // In some cases (currently tested on Chrome), backspacing when the column is selected will delete all paragraph tags without triggering the observer.
      // This is a workaround to ensure that the column is always valid.
      if (MceElement.isEmpty(this.innerNode)) {
        e.preventDefault();
        this.checkChildren();
        console.log("Trying to fix things!");
        return false;
      } else {
        // If selection is at the start of the column, don't do anything
        const selection = this.parentGrid.editor.selection;
        const rng = selection.getRng();
        if (
          e.key === "Backspace" &&
          selection.isCollapsed() &&
          rng.startOffset === 0 &&
          Array.from(this.innerNode.children)
            .filter((e) => (e as HTMLElement)?.style?.display !== "none")
            .findIndex(
              (e) => e === selection.getStart().closest(".cgb-col-inner > *")
            ) === 0
        ) {
          e.preventDefault();
          return false;
        }
      }
    });
    // Watch innernode for changes (just to be safe)
    this.watchNodes.set(this.innerNode, {});
    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();
    // Set up popover
    this.popover = this.setupPopover(ColMenu, { col: this }, "bottom");
    this.isSelected.subscribe((selected) => {
      if (selected && get(this.showPopover)) {
        !this.popover.isActive && this.popover.show();
      } else {
        if (this.popover.isActive) {
          this.popover.hide();
        }
      }
    });
    let curSel: any;
    this.isSelected.subscribe(() => {
      const par = get(this.parent);
      console.log(
        "Selected",
        Array.from(get(this.selected)),
        par !== false ? Array.from(get(par.selected)) : null
      );
    });
  }
  toString() {
    return "<Column/>";
  }
}
