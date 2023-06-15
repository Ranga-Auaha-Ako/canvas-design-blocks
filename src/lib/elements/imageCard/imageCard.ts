import { nanoid } from "nanoid";
import type { stateObject } from "src/main";
import type { Editor } from "tinymce";
import MceElement from "../generic/mceElement";
import ImageCardManager from "./imageCardManager";
import { ImageCardLabel } from "./imageCardLabel";
import { ImageCardRow } from "./imageCardRow";
import { get, Writable } from "svelte/store";

export class ImageCard extends MceElement {
  attributes: MceElement["attributes"] = new Map([]);
  selectionMethod: "TinyMCE" | "focus" = "TinyMCE";
  public static markupVersion = "1.0.0";
  public staticAttributes = {
    "data-cdb-version": ImageCard.markupVersion,
  };
  public static staticStyle: Partial<CSSStyleDeclaration> = {
    width: "175px",
    height: "130px",
    display: "flex",
    alignItems: "flex-end",
    color: "white",
    textDecoration: "none",
    overflow: "hidden",
  };

  defaultClasses = new Set(["ImageCard", "uoa_shadowbox", "uoa_corners_8"]);

  public placeholder: HTMLElement | undefined;
  private _setupPlaceholder() {
    if (this.placeholder) return this.placeholder;
    this.placeholder = this.node.insertAdjacentElement(
      "afterbegin",
      document.createElement("div")
    ) as HTMLElement;
    this.placeholder.setAttribute("contenteditable", "true");
    this.placeholder.dataset.mceBogus = "1";
    this.placeholder.classList.add("imageSelplaceholder");
    Object.assign(this.placeholder.style, {
      position: "absolute",
      top: "0",
      left: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    this.placeholder.innerHTML = "";
    // this.placeholder.innerHTML = "Inserting image...";
    // Watch for changes to the placeholder
    const observer = new MutationObserver((mutations) => {
      let url;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          // If the placeholder contains an image, use the link and clear the contents
          for (const node of mutation.addedNodes.values()) {
            if (node.nodeName === "IMG") {
              url = (node as HTMLImageElement).getAttribute("src");
              console.log("Found url:", url);
            }
          }
        }
      });
      console.log("URL:", url);
      if (url) {
        // Use this image url
        this.setImage(url);
        if (this.placeholder) {
          this.placeholder.remove();
        }
        observer.disconnect();
        this._setupPlaceholder();
      }
    });
    observer.observe(this.placeholder, {
      childList: true,
    });
    return this.placeholder;
  }

  public setImage(url: string) {
    const style = this.mergedAttributes.get("style");
    if (style) {
      (style as Writable<CSSStyleDeclaration>).update((style) => {
        // style.backgroundImage = `linear-gradient(to top, #000000a1, #00000029), url('${url}')`;
        // style.backgroundSize = "cover";
        style.backgroundPosition = "center";
        // style.setProperty("background", `center / cover`);
        style.setProperty("background-image", `url("${url}")`);
        // this.node.setAttribute(
        //   "style",
        //   `${style.cssText} background: center / cover; background-image: url('${url}');`
        // );
        return style;
      });
    }
  }

  public openImageSelector() {
    const placeholder = this._setupPlaceholder();
    this.editor.selection.select(placeholder);
    this.editor.execCommand("mceInstructureImage");
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public node: HTMLElement,
    public cardRow: ImageCardRow,
    public readonly id = nanoid()
  ) {
    super(node, editor, undefined, undefined, id);

    Object.entries(this.staticAttributes).forEach(([key, value]) => {
      if (node.getAttribute(key) !== value) {
        node.setAttribute(key, value);
      }
    });

    // Create placholder
    this._setupPlaceholder();

    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();

    this.node.addEventListener("click", (e) => {
      e.preventDefault();
      // this.select();
      // this.delete();
      return false;
    });
    this.node.addEventListener("contextmenu", (e) => {
      // Attempt to pick image
      this.openImageSelector();
      e.preventDefault();
      return false;
    });
  }

  static import(
    state: stateObject,
    node: HTMLElement,
    cardRow: ImageCardRow,
    editor: Editor
  ) {
    if (node.dataset.cdbVersion !== this.markupVersion) {
      Object.assign(node.style, this.staticStyle);
    }
    const imageCard = new ImageCard(
      state,
      editor,
      node,
      cardRow,
      node.dataset.cdbId
    );
    const childEl = imageCard.node.querySelector("span.ImageCardLabel");
    if (childEl) {
      const child = ImageCardLabel.import(
        state,
        childEl as HTMLElement,
        imageCard,
        editor
      );
    } else {
      const child = ImageCardLabel.create(state, imageCard, editor);
    }
    return imageCard;
  }

  static create(state: stateObject, cardRow: ImageCardRow, editor: Editor) {
    const node = editor.dom.create("a", { href: "#" });
    Object.assign(node.style, this.staticStyle);
    editor.dom.add(cardRow.node, node);
    // Create instance
    const imageCard = new this(state, editor, node, cardRow, undefined);
    const child = ImageCardLabel.create(state, imageCard, editor);

    return imageCard;
  }
  checkChildren() {
    this.stopObserving();
    // TODO: Check child
    this.startObserving();
  }
  checkSelf() {
    this.stopObserving();
    if (!this.editor.getBody().contains(this.node)) {
      this.cardRow.removeCard(this);
    }
    const href = this.mergedAttributes.get("href");
    href && href.update((href) => (href = "#zac"));
    this.startObserving();
  }
}
