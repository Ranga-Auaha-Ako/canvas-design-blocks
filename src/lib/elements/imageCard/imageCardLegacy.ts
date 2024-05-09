// This file handles the migration of non-svelte imageCards to svelte imageCards

import { stateObject } from "src/desktop";
import ImageCardManager from "./imageCardManager";
import { get } from "svelte/store";
import {
  CardData,
  DefaultSize,
  DefaultTheme,
  ImageCardSize,
  ImageCardTheme,
  RowData,
  ValidSizes,
  ValidThemes,
} from "./imageCard";
import { nanoid } from "nanoid";

export class ImageCardLegacy {
  public selector = ".ImageCardRow[data-cdb-version]";
  public document: Document;
  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor,
    public readonly newManager: ImageCardManager
  ) {
    this.document = editor.getDoc();
    this.importAll();
  }

  public findAll(returnAll = false) {
    const root = this.editor.dom.getRoot();
    return Array.from(root.querySelectorAll(this.selector)).filter((e) => {
      if (returnAll) return true;
      // Discard TinyMCE Fake Elements
      if (e.closest("[data-mce-bogus]")) return false;
      return true;
    }) as HTMLElement[];
  }

  public importAll() {
    if (this.detached) return;
    this.findAll().forEach((el) => {
      // Create wrapper element
      const newElementSeed = this.document.createElement("div");
      newElementSeed.classList.add("ImageCards");
      newElementSeed.dataset.cdbId = el.dataset.cdbId;
      newElementSeed.dataset.cdbVersion = el.dataset.cdbVersion;
      // Create data element
      const newDataEl = this.document.createElement("div");
      newDataEl.classList.add("cdbData");
      newElementSeed.appendChild(newDataEl);
      // Grab state from old element
      const sizeClass = [...el.classList].find((c) =>
        c.startsWith("imageCardSize")
      );
      const size = ValidSizes.includes(sizeClass as ImageCardSize)
        ? (sizeClass as ImageCardSize)
        : get(DefaultSize);
      const themeClass = [...el.classList].find((c) =>
        c.startsWith("imageCardTheme")
      );
      const theme = ValidThemes.includes(themeClass as ImageCardTheme)
        ? (themeClass as ImageCardTheme)
        : get(DefaultTheme);
      const state: RowData = {
        size,
        theme,
        labelOverlaid: false,
        cards: [],
      };
      el.querySelectorAll<HTMLAnchorElement>("a.ImageCard").forEach((card) => {
        const backgroundImage = card.style.backgroundImage;
        const imageUrl = backgroundImage.match(
          /url\((['"]?)([^'")]*)\1\)/
        )?.[2];
        const cardState: CardData = {
          label:
            card.querySelector<HTMLDivElement>("span.ImageCardLabel")
              ?.innerText || "",
          link: card.getAttribute("href") || "#",
          image: imageUrl || "",
          id: card.dataset.cdbId || nanoid(),
        };
        state.cards.push(cardState);
      });
      // Update data element
      newDataEl.innerText = JSON.stringify(state);
      // Insert adjacent to old element
      el.insertAdjacentElement("afterend", newElementSeed);
      const imageCards = this.newManager.elementClass.import(
        this.state,
        newElementSeed,
        this.newManager,
        this.editor
      );
      // Add new element to manager
      this.newManager.add(imageCards);
      // Remove old element
      el.remove();
    });
  }
  detached = false;
  public detatch() {
    this.detached = true;
  }
}

export default ImageCardLegacy;
